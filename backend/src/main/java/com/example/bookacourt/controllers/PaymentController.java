package com.example.bookacourt.controllers;

import com.example.bookacourt.dtos.CheckoutSessionRequest;
import com.example.bookacourt.dtos.PaymentResponse;
import com.example.bookacourt.enums.BookingStatus;
import com.example.bookacourt.services.BookingService;
import com.example.bookacourt.services.PaymentService;
import com.stripe.Stripe;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final BookingService bookingService;
    private final PaymentService paymentService;


    public PaymentController(BookingService bookingService,
                             PaymentService paymentService) {
        this.bookingService = bookingService;
        this.paymentService = paymentService;
    }

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${stripe.webhook.secret}")
    private String endpointSecret;

    @PreAuthorize("hasRole('USER')")
    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@RequestBody CheckoutSessionRequest checkoutSessionRequest) {
        Stripe.apiKey = stripeSecretKey;
        try {
            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(frontendUrl + "/payment-success?session_id={CHECKOUT_SESSION_ID}")
                    .setCancelUrl(frontendUrl + "/payment-cancel")
                    .setExpiresAt(Instant.now().getEpochSecond() + 1800) // 30 minutes from now
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setQuantity(1L)
                                    .setPriceData(
                                            SessionCreateParams.LineItem.PriceData.builder()
                                                    .setCurrency("eur")
                                                    .setUnitAmount(checkoutSessionRequest.getPriceInCents()) // e.g., 1000 = €10.00
                                                    .setProductData(
                                                            SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                    .setName("Court Booking")
                                                                    .build()
                                                    )
                                                    .build()
                                    )
                                    .build()
                    )
                    .putMetadata("bookingId", checkoutSessionRequest.getBookingId().toString())
                    .putMetadata("userId", checkoutSessionRequest.getUserId().toString())
                    .putMetadata("bookingStatus", checkoutSessionRequest.getBookingStatus().toString())
                    .build();

            Session session = Session.create(params);

            return ResponseEntity.ok(Map.of("sessionId", session.getId()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/stripe/webhook")
    public ResponseEntity<String> handleStripeEvent(@RequestBody String payload, @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, endpointSecret);

            if ("checkout.session.completed".equals(event.getType())) {
                Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);
                if (session != null) {
                    String bookingId = session.getMetadata().get("bookingId");
                    BookingStatus bookingStatus = BookingStatus.valueOf(session.getMetadata().get("bookingStatus"));
                    String userId = session.getMetadata().get("userId");
                    String paymentIntentId = session.getPaymentIntent();
                    Long amount = session.getAmountTotal();

                    bookingService.addPaymentToBooking(UUID.fromString(bookingId), bookingStatus, UUID.fromString(userId),
                            amount, paymentIntentId);
                    bookingService.sendBookingConfirmationEmail(UUID.fromString(bookingId), UUID.fromString(userId));
                }
            }

            return ResponseEntity.ok("");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("");
        }
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/user-payments")
    public ResponseEntity<?> getUserPayments(Pageable pageable) {
        try{
            log.info("Fetching user payments");
            Page<PaymentResponse> payments = paymentService.getUserPayments(pageable);
            return ResponseEntity.ok(payments);
        }catch (Exception e){
            log.error("Error getting user payments", e);
            return ResponseEntity.badRequest().body("Error getting user payments: " + e.getMessage());
        }
    }

}
