import type { WorldRoad } from '../types';

export declare function chooseTrafficRoutes(
  roads: readonly WorldRoad[],
  centerZ?: number,
  limit?: number,
): WorldRoad[];
