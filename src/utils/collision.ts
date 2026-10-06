import type { Asset3DData, AssetTemplate } from "../types/digitalTwin";

export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
}

/**
 * Returns effective 2D footprint size (width along X, depth along Z) for an asset.
 */
export function getAssetSize(asset: Partial<Asset3DData> | AssetTemplate): { width: number; depth: number } {
  if ("width" in asset && "depth" in asset && asset.width && asset.depth) {
    return { width: asset.width, depth: asset.depth };
  }
  const typeStr = ("type" in asset ? asset.type : "") || ("category" in asset ? asset.category : "") || "";
  const nameStr = asset.name || "";
  const combined = (typeStr + " " + nameStr).toLowerCase();

  if (combined.includes("conveyor") || combined.includes("line")) {
    return { width: 6.0, depth: 0.88 };
  }
  
  if (combined.includes("meter") || combined.includes("panel") || combined.includes("machine")) {
    return { width: 1.5, depth: 1.5 };
  }

  // Default machine size footprint
  return { width: 1.5, depth: 1.5 };
}

/**
 * Calculates 2D Axis-Aligned Bounding Box (AABB) centered at (x, z).
 */
export function getAssetBoundingBox(
  x: number,
  z: number,
  size: { width: number; depth: number }
): BoundingBox2D {
  const halfW = size.width / 2;
  const halfD = size.depth / 2;
  return {
    minX: x - halfW,
    maxX: x + halfW,
    minZ: z - halfD,
    maxZ: z + halfD,
    width: size.width,
    depth: size.depth,
  };
}

/**
 * Checks if two 2D bounding boxes overlap with an optional safety margin (padding).
 */
export function checkAABBCollision(
  boxA: BoundingBox2D,
  boxB: BoundingBox2D,
  padding = 0.05
): boolean {
  return (
    boxA.minX < boxB.maxX + padding &&
    boxA.maxX > boxB.minX - padding &&
    boxA.minZ < boxB.maxZ + padding &&
    boxA.maxZ > boxB.minZ - padding
  );
}

/**
 * Resolves proposed position (targetX, targetZ) for an asset against all other assets.
 * Returns the non-colliding (slide-resolved) coordinates and whether contact occurred.
 */
export function resolveAssetCollision(
  movingAssetId: string | null,
  targetX: number,
  targetZ: number,
  movingAssetSize: { width: number; depth: number },
  otherAssets: Asset3DData[],
  maxIterations = 5
): { x: number; z: number; isColliding: boolean; contactingAssetId?: string } {
  let currX = targetX;
  let currZ = targetZ;
  let hasCollision = false;
  let contactingId: string | undefined = undefined;

  const obstacles = otherAssets.filter((a) => a.id !== movingAssetId);
  if (obstacles.length === 0) {
    return { x: currX, z: currZ, isColliding: false };
  }

  const padding = 0.05; // 5cm safety collision offset

  for (let iter = 0; iter < maxIterations; iter++) {
    let resolvedInIter = false;

    for (const obstacle of obstacles) {
      const obstacleSize = getAssetSize(obstacle);
      const obstacleBox = getAssetBoundingBox(obstacle.x, obstacle.y, obstacleSize);
      const movingBox = getAssetBoundingBox(currX, currZ, movingAssetSize);

      if (checkAABBCollision(movingBox, obstacleBox, padding)) {
        hasCollision = true;
        contactingId = obstacle.id;

        // Calculate overlap on X and Z axes
        const overlapX1 = movingBox.maxX + padding - obstacleBox.minX;
        const overlapX2 = obstacleBox.maxX - (movingBox.minX - padding);
        const overlapX = Math.min(overlapX1, overlapX2);

        const overlapZ1 = movingBox.maxZ + padding - obstacleBox.minZ;
        const overlapZ2 = obstacleBox.maxZ - (movingBox.minZ - padding);
        const overlapZ = Math.min(overlapZ1, overlapZ2);

        // Slide along axis of minimum penetration
        if (overlapX < overlapZ) {
          if (currX >= obstacle.x) {
            currX += overlapX;
          } else {
            currX -= overlapX;
          }
        } else {
          if (currZ >= obstacle.y) {
            currZ += overlapZ;
          } else {
            currZ -= overlapZ;
          }
        }
        resolvedInIter = true;
      }
    }

    if (!resolvedInIter) break;
  }

  return {
    x: currX,
    z: currZ,
    isColliding: hasCollision,
    contactingAssetId: contactingId,
  };
}
