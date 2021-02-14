import { hourstepToDate } from './shared/frontend/chrono';
type datedValueT<T> = {
  date: Date,
  value: T,
};

type distancedValueT<T> = {
  distance: number,
  datedValue: datedValueT<T>,
};
type getDateFnT<T> = (value: T) => Date;
type getDateToHourstepDistanceFnT = (hourstep: number, date: Date) => number;

export function alignToHourstep<T>(values: T[], fromHourstep: number, toHourstep: number, getDateFn: getDateFnT<T>, getDateToHourstepDistanceFn: getDateToHourstepDistanceFnT): T[] {
  const hourstepsCount: number = toHourstep - fromHourstep;
  const datedValues: datedValueT<T>[] = values.map(value => { return {date: getDateFn(value), value}; });
  const alignedValues: T[] = [];
  for (let hourstepIdx = 0; hourstepIdx < hourstepsCount; hourstepIdx++) {
    const hourstep: number = fromHourstep + hourstepIdx;
    const distancedValues: distancedValueT<T>[] = datedValues.map((datedValue) => {
      const distance = getDateToHourstepDistanceFn(hourstep, datedValue.date);
      return {distance, datedValue};
    });
    const firstValue = distancedValues[0];
    if (firstValue) {
      const closestDistancedValue = distancedValues.reduce((closestDistancedValue, distancedValue) => {
        if (distancedValue.distance < closestDistancedValue.distance) {
          closestDistancedValue = distancedValue;
        }
        return closestDistancedValue;
      }, firstValue);
      alignedValues[hourstepIdx] = closestDistancedValue.datedValue.value;
    }

  }
  return alignedValues;
}