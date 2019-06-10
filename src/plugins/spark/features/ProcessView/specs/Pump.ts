import { ACCELERATE_OTHERS, DEFAULT_PUMP_PRESSURE, LEFT, RIGHT, defaultSpec } from '../getters';
import { ComponentSpec, PartUpdater, StatePart } from '../types';

const spec: ComponentSpec = {
  ...defaultSpec,
  transitions: (part: StatePart) => {
    const p = (part.settings || {}).disabled ? 0 : part.settings.pressure || DEFAULT_PUMP_PRESSURE;
    return {
      [LEFT]: [{ outCoords: RIGHT }],
      [RIGHT]: [{ outCoords: LEFT, pressure: p, liquids: [ACCELERATE_OTHERS] }],
    };
  },
  interactHandler: (part: StatePart, updater: PartUpdater) => {
    part.settings.disabled = !part.settings.disabled;
    updater.updatePart(part);
  },
};

export default spec;