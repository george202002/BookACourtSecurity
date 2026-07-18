import React from "react";
import "../styles/LoadingModal.css";

type LoadingModalProps = {
  isOpen: boolean;
  message?: string;
};

const LoadingModal: React.FC<LoadingModalProps> = ({
  isOpen,
  message = "Loading...",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay-custom position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ zIndex: 1050 }}
    >
      <div className="modal-container-custom card shadow-lg border-0 text-center p-4" style={{ maxWidth: '300px' }}>
        <div className="d-flex flex-column align-items-center gap-3">
          <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-secondary mb-0 fw-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
