import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { X } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../lib/categories";
import { timeAgo } from "../lib/time";
import type { LatLng } from "../lib/geo";
import type { IssueCategory, PlantReport } from "../lib/types";

/** Pins closer together than this many pixels, and of the same issue type, merge into one. */
const CLUSTER_PX = 56;
const MAX_ZOOM = 17;

interface Cluster {
  key: string;
  category: IssueCategory;
  reports: PlantReport[];
  lat: number;
  lng: number;
}

interface Props {
  reports: PlantReport[];
  /** The person's own saved location, drawn as a blue dot and used as the starting view. */
  center: LatLng | null;
  /** Changes when the map should re-frame itself (scope or location changed). */
  fitKey: string;
}

function pinIcon(category: IssueCategory, count: number, selected: boolean): L.DivIcon {
  const size = count > 1 ? Math.min(30 + count * 1.5, 46) : 22;
  const ring = selected ? "box-shadow:0 0 0 4px rgba(22,163,74,0.45),0 1px 5px rgba(0,0,0,.35);" : "";
  return L.divIcon({
    className: "",
    html: `<div class="pin" style="width:${size}px;height:${size}px;background:${CATEGORY_COLORS[category]};${ring}">${count > 1 ? count : ""}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Groups reports by issue type and screen proximity at the current zoom. */
function cluster(reports: PlantReport[], map: L.Map, zoom: number): Cluster[] {
  const cells = new Map<string, PlantReport[]>();
  for (const report of reports) {
    if (report.lat === undefined || report.lng === undefined) continue;
    const point = map.project([report.lat, report.lng], zoom);
    const key = `${report.diagnosis.category}:${Math.floor(point.x / CLUSTER_PX)}:${Math.floor(point.y / CLUSTER_PX)}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(report);
    else cells.set(key, [report]);
  }

  return [...cells.entries()].map(([key, members]) => ({
    key,
    category: members[0].diagnosis.category,
    reports: members,
    lat: members.reduce((sum, r) => sum + (r.lat ?? 0), 0) / members.length,
    lng: members.reduce((sum, r) => sum + (r.lng ?? 0), 0) / members.length,
  }));
}

function FitView({ reports, center, fitKey }: Props) {
  const map = useMap();
  useEffect(() => {
    const points = reports
      .filter((r) => r.lat !== undefined && r.lng !== undefined)
      .map((r) => [r.lat!, r.lng!] as [number, number]);
    if (center) points.push([center.lat, center.lng]);

    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 12);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
    // Only re-frame when the scope changes, not each time a filter toggles a pin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);
  return null;
}

function Pins({
  reports,
  selectedIds,
  onSelect,
}: {
  reports: PlantReport[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
    click: () => onSelect([]),
  });

  const clusters = useMemo(() => cluster(reports, map, zoom), [reports, map, zoom]);

  return (
    <>
      {clusters.map((group) => (
        <Marker
          key={group.key}
          position={[group.lat, group.lng]}
          icon={pinIcon(
            group.category,
            group.reports.length,
            group.reports.some((r) => selectedIds.includes(r.id)),
          )}
          title={`${group.reports.length} ${CATEGORY_LABELS[group.category]} report${group.reports.length === 1 ? "" : "s"}`}
          eventHandlers={{
            click: (event) => {
              L.DomEvent.stopPropagation(event as unknown as Event);
              onSelect(group.reports.map((r) => r.id));
            },
          }}
        />
      ))}
    </>
  );
}

function PreviewCard({
  reports,
  onClose,
  onZoomIn,
  canZoomIn,
}: {
  reports: PlantReport[];
  onClose: () => void;
  onZoomIn: () => void;
  canZoomIn: boolean;
}) {
  const category = reports[0].diagnosis.category;
  const shown = reports.slice(0, 4);

  return (
    <div className="absolute inset-x-3 bottom-3 z-[1100] rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
          <span className="size-2.5 rounded-full" style={{ background: CATEGORY_COLORS[category] }} aria-hidden />
          {reports.length === 1
            ? CATEGORY_LABELS[category]
            : `${reports.length} reports · ${CATEGORY_LABELS[category]}`}
        </p>
        <button type="button" onClick={onClose} aria-label="Close preview" className="text-neutral-400 hover:text-black">
          <X size={16} />
        </button>
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {shown.map((report) => (
          <li key={report.id}>
            <Link to={`/report/${report.id}`} className="flex items-center gap-3 rounded-xl hover:bg-neutral-50">
              {report.photoUrls[0] ? (
                <img src={report.photoUrls[0]} alt="" loading="lazy" className="size-12 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="size-12 shrink-0 rounded-lg bg-neutral-100" aria-hidden />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-black">{report.diagnosis.plantName}</span>
                <span className="block truncate text-xs text-neutral-500">
                  {timeAgo(report.createdAt)}
                  {report.helpfulCount > 0 && ` · ${report.helpfulCount} found helpful`}
                </span>
                {reports.length === 1 && (
                  <span className="mt-0.5 line-clamp-2 block text-xs text-neutral-600">{report.diagnosis.summary}</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {reports.length > shown.length && (
        <p className="mt-1.5 text-xs text-neutral-400">and {reports.length - shown.length} more here</p>
      )}
      {reports.length > 1 && canZoomIn && (
        <button
          type="button"
          onClick={onZoomIn}
          className="mt-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:border-black hover:text-black"
        >
          Zoom in
        </button>
      )}
    </div>
  );
}

/** The community map: nearby reports as pins, merged by issue type where they overlap, with
 * a small preview card on tap. Loaded lazily; Leaflet is the heaviest dependency here. */
export default function CommunityMap({ reports, center, fitKey }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [map, setMap] = useState<L.Map | null>(null);

  const selected = useMemo(
    () => reports.filter((r) => selectedIds.includes(r.id)),
    [reports, selectedIds],
  );

  return (
    <div className="map-shell relative h-80 overflow-hidden rounded-2xl border border-neutral-200 sm:h-[26rem]">
      <MapContainer
        center={center ? [center.lat, center.lng] : [20, 0]}
        zoom={center ? 11 : 2}
        minZoom={2}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom={false}
        ref={setMap}
        className="size-full"
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />
        <FitView reports={reports} center={center} fitKey={fitKey} />
        {center && (
          <CircleMarker
            center={[center.lat, center.lng]}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
          />
        )}
        <Pins reports={reports} selectedIds={selectedIds} onSelect={setSelectedIds} />
      </MapContainer>

      {selected.length > 0 && (
        <PreviewCard
          reports={selected}
          onClose={() => setSelectedIds([])}
          canZoomIn={(map?.getZoom() ?? MAX_ZOOM) < MAX_ZOOM}
          onZoomIn={() => {
            if (!map) return;
            const points = selected.map((r) => [r.lat!, r.lng!] as [number, number]);
            map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: MAX_ZOOM });
            setSelectedIds([]);
          }}
        />
      )}
    </div>
  );
}
