import React from "react";
import "../styles/MessageModal.css";

export type MessageType = "success" | "error" | "warning" | "info";

interface MessageModalProps {
  isOpen: boolean;
  type: MessageType;
  title: string;
  message: string;
  onClose: () => void;
  confirmText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  icon?: string;
}

const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  type,
  title,
  message,
  onClose,
  confirmText = "OK",
  showCancel = false,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Map message type to Bootstrap variants
  const getButtonVariant = () => {
    switch (type) {
      case "success": return "success";
      case "error": return "danger";
      case "warning": return "warning";
      case "info": return "info";
      default: return "primary";
    }
  };

  const getAlertVariant = () => {
    switch (type) {
      case "success": return "success";
      case "error": return "danger";
      case "warning": return "warning";
      case "info": return "info";
      default: return "info";
    }
  };

  return (
    <div
      className="modal-overlay-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      onClick={handleBackdropClick}
      style={{ zIndex: 1050 }}
    >
      <div className="modal-container-custom card shadow-lg border-0" style={{ maxWidth: '400px', width: '100%' }}>
        <div className={`card-header bg-${getAlertVariant()} bg-opacity-10 border-bottom d-flex justify-content-between align-items-center py-3`}>
          <h5 className={`mb-0 fw-bold text-${getAlertVariant()}`}>{title}</h5>
          <button
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          />
        </div>

        <div className="card-body py-4">
          <p className="text-secondary mb-0">{message}</p>
        </div>

        <div className="card-footer bg-white border-top d-flex justify-content-end gap-2 py-3">
          {showCancel && (
            <button
              className="btn btn-outline-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
          )}
          <button
            className={`btn btn-${getButtonVariant()}`}
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
