package com.example.bookacourt.services;

import com.example.bookacourt.dtos.PaymentResponse;
import com.example.bookacourt.entities.BookingEntity;
import com.example.bookacourt.entities.PaymentEntity;
import com.example.bookacourt.entities.UserEntity;
import com.example.bookacourt.repositories.PaymentRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Refund;
import com.stripe.param.RefundCreateParams;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PaymentService {

    @Value("${stripe.secret-key}")
    private String stripeSecretKey;

    private final PaymentRepository paymentRepository;
    private final CurrentUserService currentUserService;

    @Autowired
    public PaymentService(PaymentRepository paymentRepository, CurrentUserService currentUserService) {
        this.paymentRepository = paymentRepository;
        this.currentUserService = currentUserService;
    }

    public Page<PaymentResponse> getUserPayments(Pageable pageable) {
        UserEntity user = currentUserService.getAuthenticatedUser();

        Page<PaymentEntity> payments = paymentRepository.findByUserId(user.getId(), pageable);

        return payments.map(payment -> toPaymentResponse(payment, user.getId()));
    }

    public Refund refundBooking(String paymentIntentId) throws StripeException {
        Stripe.apiKey = stripeSecretKey;

        RefundCreateParams refundParams = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .build();

        return Refund.create(refundParams);
    }

    private PaymentResponse toPaymentResponse(PaymentEntity payment, UUID userId) {
        BookingEntity booking = payment.getBooking();
        return new PaymentResponse(
                payment.getId(),
                booking.getId(),
                userId,
                payment.getAmountInCents(),
                payment.getStatus(),
                booking.getCourt().getName(),
                payment.getCreatedAt().toString(),
                payment.getUpdatedAt().toString()
        );
    }
}