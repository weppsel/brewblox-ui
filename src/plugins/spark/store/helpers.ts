import { Link } from '@/helpers/units';

import { ConstraintsObj } from '../components/Constraints/ConstraintsBase';
import { constraintLabels } from '../helpers';
import { Block, BlockLink,Limiters } from '../types';

export const calculateDrivenChains = (blocks: Block[]): string[][] => {
  const output: string[][] = [];

  const drivenBlocks: { [driven: string]: string[] } = {};

  for (const block of blocks) {
    Object
      .values(block.data)
      .filter((obj: any) => obj instanceof Link && obj.driven && obj.id)
      .forEach((obj: any) => {
        const existing = drivenBlocks[obj.id] || [];
        drivenBlocks[obj.id] = [...existing, block.id];
      });
  }

  const generateChains =
    (chain: string[], latest: string): string[][] => {
      const additional: string[] = drivenBlocks[latest];
      if (!additional) {
        return [[...chain, latest]];
      }
      return additional
        .filter(id => !chain.includes(id))
        .reduce(
          (chains: string[][], id: string) => [...chains, ...generateChains([...chain, latest], id)],
          [],
        );
    };

  return Object.keys(drivenBlocks)
    .reduce((acc, k) => ([...acc, ...generateChains([], k)]), output);
};

export const calculateBlockLinks = (blocks: Block[]): BlockLink[] => {
  const linkArray: BlockLink[] = [];

  const findRelations =
    (source: string, relation: string[], val: any): BlockLink[] => {
      if (val instanceof Link) {
        if (val.id === null || source === 'DisplaySettings') {
          return linkArray;
        }
        return [{
          source: source,
          target: val.toString(),
          relation: relation,
        }];
      }
      if (val instanceof Object) {
        return Object.entries(val)
          .reduce(
            (acc, child: Mapped<any>) => {
              if (child[0].startsWith('driven')) {
                return acc;
              }
              return [...acc, ...findRelations(source, [...relation, child[0]], child[1])];
            },
            linkArray
          );
      }
      return linkArray;
    };

  const allLinks: BlockLink[] = [];
  for (const block of blocks) {
    allLinks.push(...findRelations(block.id, [], block.data));
  }

  return allLinks;
};

export const calculateLimiters = (blocks: Block[]): Limiters => {
  const limited: Limiters = {};

  for (const block of blocks) {
    const obj: ConstraintsObj = block.data.constrainedBy;
    if (!obj || obj.constraints.length === 0) {
      continue;
    }
    limited[block.id] = [...obj.constraints]
      .filter(c => c.limiting)
      .map(c => Object.keys(c).find(key => key !== 'limiting') || '??')
      .map(k => constraintLabels.get(k) as string);
  }

  return limited;
};
