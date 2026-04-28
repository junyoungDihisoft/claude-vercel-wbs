import { ViewToggle } from './view-toggle';

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand">
          <div className="brand-mark">W</div>
          <div className="brand-name">WBS</div>
          <div className="brand-sub">v0.1 · MVP</div>
        </div>
        <ViewToggle />
        <div className="app-spacer" />
      </div>
    </header>
  );
}
