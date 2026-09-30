// docs/prototype-spec.md B.4/C.3/C.4: estado de carga visual (nunca pantalla en blanco).
export function SkeletonLine({ width = '100%', height = '1em' }: { width?: string; height?: string }) {
  return <span className="mj-skeleton" style={{ width, height, display: 'block' }} aria-hidden="true" />;
}

export function SkeletonProjectGrid() {
  return (
    <div className="mj-project-grid" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="mj-card mj-project-card">
          <SkeletonLine width="60%" height="1.3em" />
          <SkeletonLine width="90%" />
          <SkeletonLine width="40%" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonBoard() {
  return (
    <div className="mj-board" aria-hidden="true">
      {[0, 1, 2, 3].map((col) => (
        <section key={col} className="mj-board-column">
          <SkeletonLine width="50%" height="1.3em" />
          <div className="mj-ticket-card" style={{ border: 'none', boxShadow: 'none', padding: 0 }}>
            <SkeletonLine width="80%" />
            <SkeletonLine width="50%" />
          </div>
        </section>
      ))}
    </div>
  );
}
