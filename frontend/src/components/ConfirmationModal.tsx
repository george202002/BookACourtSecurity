import React from "react";
import "../styles/ConfirmationModal.css";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
};

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      onConfirm();
    }
  };

  // Map type to Bootstrap button variant
  const buttonVariant = type === "danger" ? "danger" : type === "warning" ? "warning" : "info";

  return (
    <div
      className="modal-overlay-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ zIndex: 1050 }}
    >
      <div className="modal-container-custom card shadow-lg border-0" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
          <h5 className="mb-0 fw-bold">{title}</h5>
          <button
            className="btn-close"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
          />
        </div>

        <div className="card-body py-4">
          <p className="text-secondary mb-0">{message}</p>
        </div>

        <div className="card-footer bg-white border-top d-flex justify-content-end gap-2 py-3">
          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`btn btn-${buttonVariant} ${isLoading ? "btn-loading" : ""}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
