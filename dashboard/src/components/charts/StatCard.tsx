interface StatCardProps {
  icon: string
  label: string
  value: string | number
  unit: string
  subLabel?: string
  color: string
}

export function StatCard({ icon, label, value, unit, subLabel, color }: StatCardProps) {
  return (
    <div className="stat-card" style={{ '--stat-color': color } as React.CSSProperties}>
      <div className="stat-card__icon">{icon}</div>
      <div className="stat-card__content">
        <div className="stat-card__label">{label}</div>
        <div className="stat-card__value">
          {value}
          <span className="stat-card__unit">{unit}</span>
        </div>
        {subLabel && <div className="stat-card__sub-label">{subLabel}</div>}
      </div>
    </div>
  )
}
