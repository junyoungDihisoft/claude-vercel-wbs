import { ViewToggle } from './view-toggle';

export function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand">
          <div className="brand-mark">W</div>
          <h1 className="brand-name">WBS</h1>
          <div className="brand-sub">v0.1 · MVP</div>
        </div>
        <ViewToggle />
        <div className="app-spacer" />
      </div>
    </header>
  );
}
