import { Navigate, Route, Routes } from "react-router";
import { WorkspaceLayout } from "./routes/WorkspaceLayout";
import { ProjectsPage } from "./routes/ProjectsPage";
import { DesignView } from "./routes/DesignView";
import { ManifestView } from "./routes/ManifestView";
import { AssetsView } from "./routes/AssetsView";
import { AssetDetailView } from "./routes/AssetDetailView";
import { RunsView } from "./routes/RunsView";
import { NotFound } from "./routes/NotFound";

/** Plain paths, no hash: the backend serves index.html for unknown routes. */
export function App() {
  return (
    <Routes>
      <Route path="/" element={<ProjectsPage />} />
      <Route path="/p/:projectId" element={<WorkspaceLayout />}>
        <Route index element={<Navigate to="design" replace />} />
        <Route path="design" element={<DesignView />} />
        <Route path="design/:doc" element={<DesignView />} />
        <Route path="manifest" element={<ManifestView />} />
        <Route path="assets" element={<AssetsView />} />
        <Route path="assets/:assetId" element={<AssetDetailView />} />
        <Route path="runs" element={<RunsView />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
