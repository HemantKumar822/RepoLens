const MAX_TRAFFIC_ROUTES = 3;

function midpointZ(road) {
  return (road.start.z + road.end.z) / 2;
}

function distanceFromCenter(road, centerZ) {
  return Math.abs(midpointZ(road) - centerZ);
}

export function chooseTrafficRoutes(roads, centerZ = 0, limit = MAX_TRAFFIC_ROUTES) {
  if (!Array.isArray(roads) || !Number.isFinite(centerZ)) return [];

  const maximum = Math.min(MAX_TRAFFIC_ROUTES, Math.max(0, Math.floor(Number.isFinite(limit) ? limit : MAX_TRAFFIC_ROUTES)));
  if (!maximum) return [];

  const horizontal = roads.filter((road) => {
    const dx = Math.abs(road.end.x - road.start.x);
    const dz = Math.abs(road.end.z - road.start.z);
    return dx > 0.01 && dx >= dz;
  });
  const byDistance = (a, b) => distanceFromCenter(a, centerZ) - distanceFromCenter(b, centerZ);
  const mainAvenue = horizontal.filter((road) => road.kind === 'avenue').sort(byDistance).slice(0, 1);
  const sideStreets = horizontal.filter((road) => road.kind !== 'avenue').sort(byDistance);

  return [...mainAvenue, ...sideStreets].slice(0, maximum);
}
