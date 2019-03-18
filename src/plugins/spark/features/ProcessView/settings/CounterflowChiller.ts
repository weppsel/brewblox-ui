import { ComponentSettings, PersistentPart } from '../state';
import { defaultSettings } from '../components/getters';
import { Coordinates, CoordinatesParam } from '@/helpers/coordinates';
import { subSquares } from '../helpers/functional';

export const CFC_TOP_LEFT = '0,0.5';
export const CFC_TOP_RIGHT = '3,0.5';
export const CFC_BOTTOM_LEFT = '0,1.5';
export const CFC_BOTTOM_RIGHT = '3,1.5';

const BLOCKED: CoordinatesParam[] = [
  [0, 0],
  [2, 0],
  [0, 1],
  [2, 1],
];

const SIZE_X = 3;
const SIZE_Y = 2;

const settings: ComponentSettings = {
  ...defaultSettings,
  size: () => [SIZE_X, SIZE_Y],
  transitions: () => ({
    [CFC_TOP_LEFT]: [{ outCoords: CFC_TOP_RIGHT }],
    [CFC_TOP_RIGHT]: [{ outCoords: CFC_TOP_LEFT }],
    [CFC_BOTTOM_LEFT]: [{ outCoords: CFC_BOTTOM_RIGHT }],
    [CFC_BOTTOM_RIGHT]: [{ outCoords: CFC_BOTTOM_LEFT }],
  }),
  blockedCoordinates: (part: PersistentPart): Coordinates[] =>
    subSquares(BLOCKED, part, part.rotate, [SIZE_X, SIZE_Y]),
};

export default settings;