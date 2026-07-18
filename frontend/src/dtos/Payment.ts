export interface Payment {
  id: number;
  bookingId: number;
  userId: number;
  amount: number;
  status: "PAID" | "REFUNDED";
  courtName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sort {
  sorted: boolean;
  empty: boolean;
  unsorted: boolean;
}

export interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: Sort;
  offset: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PaginatedPaymentResponse {
  content: Payment[];
  pageable: Pageable;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort: Sort;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface PaymentHistory {
  payments: Payment[];
  totalCount: number;
  totalAmount: number;
}
