import type { CheckoutSessionRequest } from './../dtos/CheckoutSessionRequest';
import type { NavigateFunction } from "react-router-dom";
import HttpClient from "../utils/HttpClient";
import type { BookingRequest } from "../dtos/Booking";
import type { PaginatedPaymentResponse } from "../dtos/Payment";

export interface CreateCheckoutSessionResponse {
  sessionId: string;
}

export interface CreateCheckoutSessionRequest {
  bookingRequest: BookingRequest;
}

export const createCheckoutSession = async (
  checkoutSessionRequest: CheckoutSessionRequest,
  navigate: NavigateFunction,
): Promise<CreateCheckoutSessionResponse> => {
  try {
    const response = await HttpClient.post(
      "/payments/create-checkout-session",
      navigate,
      checkoutSessionRequest
    );

    if (!response.ok) {
      throw new Error("Failed to create checkout session");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
};

export const redirectToStripeCheckout = (sessionId: string): void => {
  // Get Stripe publishable key from environment
  const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!stripePublishableKey) {
    console.error("Stripe publishable key not found in environment variables");
    throw new Error("Payment system configuration error");
  }

  // Redirect to Stripe Checkout
  interface StripeError {
    message: string;
  }

  interface StripeResult {
    error?: StripeError;
  }

  const stripe = (
    window as unknown as {
      Stripe: (key: string) => {
        redirectToCheckout: (options: {
          sessionId: string;
        }) => Promise<StripeResult>;
      };
    }
  ).Stripe(stripePublishableKey);
  if (stripe) {
    stripe.redirectToCheckout({ sessionId }).then((result: StripeResult) => {
      if (result.error) {
        console.error("Stripe checkout error:", result.error);
        throw new Error(result.error.message);
      }
    });
  } else {
    console.error("Stripe not loaded - make sure Stripe.js is included");
    throw new Error("Payment system not available");
  }
};

export const getUserPayments = async (
  navigate: NavigateFunction,
  page: number = 0,
  size: number = 10,
): Promise<PaginatedPaymentResponse> => {
  try {
    const response = await HttpClient.get(
      `/payments/user-payments?page=${page}&size=${size}`,
      navigate,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user payments");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching user payments:", error);
    throw error;
  }
};
