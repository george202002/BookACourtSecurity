export type SkeletonVariant =
  | "stats"
  | "bookings"
  | "courts"
  | "table"
  | "card"
  | "list"
  | "filters"
  | "dashboard";

interface LoadingSkeletonProps {
  variant: SkeletonVariant;
  count?: number;
  className?: string;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant,
  count = 1,
  className = "",
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case "stats":
        return <StatsSkeleton count={count} />;
      case "bookings":
        return <BookingsSkeleton count={count} />;
      case "courts":
        return <CourtsSkeleton count={count} />;
      case "table":
        return <TableSkeleton count={count} />;
      case "card":
        return <CardSkeleton count={count} />;
      case "list":
        return <ListSkeleton count={count} />;
      case "filters":
        return <FiltersSkeleton />;
      case "dashboard":
        return <DashboardSkeleton />;
      default:
        return <CardSkeleton count={count} />;
    }
  };

  return (
    <div className={`loading-skeleton-container ${className}`}>
      {renderSkeleton()}
    </div>
  );
};

// Stats cards skeleton
const StatsSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="skeleton-stats-grid">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-stat-card">
        <div className="skeleton-stat-icon"></div>
        <div className="skeleton-stat-content">
          <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
          <div className="skeleton skeleton-value"></div>
          <div className="skeleton skeleton-text" style={{ width: "40%" }}></div>
        </div>
      </div>
    ))}
  </div>
);

// Bookings cards skeleton
const BookingsSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="skeleton-bookings-grid">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-booking-card">
        <div className="skeleton-booking-header">
          <div className="skeleton skeleton-text" style={{ width: "70%" }}></div>
          <div className="skeleton skeleton-badge"></div>
        </div>
        <div className="skeleton-booking-body">
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text" style={{ width: "80%" }}></div>
        </div>
        <div className="skeleton-booking-footer">
          <div className="skeleton skeleton-text" style={{ width: "30%" }}></div>
          <div className="skeleton skeleton-button-small"></div>
        </div>
      </div>
    ))}
  </div>
);

// Courts cards skeleton (visual cards with court image)
const CourtsSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="skeleton-courts-grid">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-court-card">
        <div className="skeleton skeleton-court-image"></div>
        <div className="skeleton-court-content">
          <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
          <div className="skeleton skeleton-text" style={{ width: "80%" }}></div>
          <div className="skeleton-court-footer">
            <div className="skeleton skeleton-text" style={{ width: "40%" }}></div>
            <div className="skeleton skeleton-price"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Table skeleton
const TableSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton skeleton-th"></div>
      ))}
    </div>
    <div className="skeleton-table-body">
      {Array.from({ length: count }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: 5 }).map((_, colIndex) => (
            <div key={colIndex} className="skeleton skeleton-td"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

// Generic card skeleton
const CardSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="skeleton-cards">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-card-item">
        <div className="skeleton-card-header">
          <div className="skeleton skeleton-avatar"></div>
          <div className="skeleton-card-header-text">
            <div className="skeleton skeleton-text" style={{ width: "70%" }}></div>
            <div className="skeleton skeleton-text" style={{ width: "50%" }}></div>
          </div>
        </div>
        <div className="skeleton-card-body">
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text"></div>
          <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
        </div>
      </div>
    ))}
  </div>
);

// List skeleton
const ListSkeleton: React.FC<{ count: number }> = ({ count }) => (
  <div className="skeleton-list">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="skeleton-list-item">
        <div className="skeleton skeleton-avatar"></div>
        <div className="skeleton-list-content">
          <div className="skeleton skeleton-text" style={{ width: "80%" }}></div>
          <div className="skeleton skeleton-text" style={{ width: "60%" }}></div>
        </div>
        <div className="skeleton skeleton-action"></div>
      </div>
    ))}
  </div>
);

// Filters section skeleton
const FiltersSkeleton: React.FC = () => (
  <div className="skeleton-filters">
    <div className="skeleton-filters-header">
      <div className="skeleton skeleton-text" style={{ width: "40%" }}></div>
      <div className="skeleton skeleton-text" style={{ width: "20%" }}></div>
    </div>
    <div className="skeleton-filters-grid">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="skeleton-filter-item">
          <div className="skeleton skeleton-label"></div>
          <div className="skeleton skeleton-input"></div>
        </div>
      ))}
    </div>
  </div>
);

// Full dashboard skeleton (stats + cards)
const DashboardSkeleton: React.FC = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-page-header">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-subtitle"></div>
    </div>
    <StatsSkeleton count={4} />
    <div className="skeleton-dashboard-grid">
      <CardSkeleton count={1} />
      <CardSkeleton count={1} />
    </div>
  </div>
);

export default LoadingSkeleton;
