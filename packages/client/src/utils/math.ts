import type {BigNumberish} from '@ethersproject/bignumber';
import {BigNumber} from '@ethersproject/bignumber';
import * as ethers from '@ethersproject/units';
import {Decimal} from 'decimal.js';

type Maybe<T> = T | null | undefined;

export const DECIMAL_UNITS = 9;
/** Max presentation units to avoid show 9 decimals on screen */
export const FIXED_UNITS = 3;

export function toFixed(
  number: Maybe<BigNumberish>,
  maxDecimals: number = FIXED_UNITS,
) {
  const [amount, decimals = '0'] = String(number?.toString() || '0.0').split(
    '.',
  );
  const minDecimals = decimals.split('').findIndex((u: string) => u !== '0');
  const canShowMinDecimals = minDecimals >= maxDecimals && amount === '0';
  const decimalFormatted = decimals.slice(
    0,
    canShowMinDecimals ? minDecimals + 1 : maxDecimals,
  );
  return [amount || 0, '.', ...decimalFormatted].join('');
}

export function formatUnits(
  number: BigNumberish,
  precision: number = DECIMAL_UNITS,
): string {
  return ethers.formatUnits(number, precision);
}

export function parseToFormattedNumber(
  value: string | BigNumberish,
  precision: number = DECIMAL_UNITS,
) {
  let val = value;
  if (typeof value === 'number') {
    val = BigInt(Math.trunc(value));
  }
  return ethers.commify(toFixed(formatUnits(val, precision), FIXED_UNITS));
}
