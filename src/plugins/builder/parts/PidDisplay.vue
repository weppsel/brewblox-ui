<script lang="ts">
import { Component } from 'vue-property-decorator';

import { PidBlock } from '@/plugins/spark/features/Pid/types';

import PartBase from '../components/PartBase';
import { COLD_WATER, HOT_WATER } from '../getters';
import { settingsBlock, settingsLink } from '../helpers';


@Component
export default class PidDisplay extends PartBase {
  HOT_WATER = HOT_WATER;
  COLD_WATER = COLD_WATER;

  get block(): PidBlock | null {
    return settingsBlock(this.part, 'pid');
  }

  get isBroken(): boolean {
    if (this.block) {
      return false;
    }
    const link = settingsLink(this.part, 'pid');
    return !!link.serviceId && !!link.blockId;
  }

  get outputValue(): number | null {
    return this.block && this.block.data.enabled
      ? this.block.data.outputValue
      : null;
  }

  get outputSetting(): number | null {
    return this.block && this.block.data.enabled
      ? this.block.data.outputSetting
      : null;
  }

  get kp(): number | null {
    return this.block
      ? this.block.data.kp.value
      : null;
  }
}
</script>

<template>
  <g>
    <foreignObject :transform="textTransformation([1,1])" :width="squares(1)" :height="squares(1)">
      <q-icon v-if="isBroken" name="mdi-alert-circle-outline" color="negative" size="lg" class="maximized" />
      <div v-else class="text-white text-bold text-center">
        <svg>
          <HeatingIcon v-if="kp && kp > 0" :stroke="outputValue ? HOT_WATER : 'white'" x="12" />
          <CoolingIcon v-else-if="kp && kp < 0" :stroke="outputValue ? COLD_WATER : 'white'" x="12" />
        </svg>
        <q-space />
        <q-icon v-if="!kp" name="mdi-calculator-variant" class="q-mr-xs" />
        <q-icon v-if="!block" name="mdi-link-variant-off" />
        <br />
        {{ outputSetting | truncateRound }}
      </div>
    </foreignObject>
    <g class="outline">
      <rect
        :width="squares(1)-2"
        :height="squares(1)-2"
        x="1"
        y="1"
        rx="6"
        ry="6"
        stroke-width="2px"
      />
    </g>
  </g>
</template>
