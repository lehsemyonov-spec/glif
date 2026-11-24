import { config } from '../config';

/**
 * Одна ось на пружине. Работает в «родных» единицах оси (wght 100–1000 и т. д.):
 * пружина линейна, поэтому одни и те же stiffness/damping дают одинаковое
 * ощущение на всех осях.
 */
export class Spring {
  value: number;
  velocity = 0;
  target: number;

  constructor(initial: number) {
    this.value = initial;
    this.target = initial;
  }

  step(dt: number): void {
    const { stiffness, damping, mass } = config.spring;
    const force = -stiffness * (this.value - this.target) - damping * this.velocity;
    this.velocity += (force / mass) * dt;
    this.value += this.velocity * dt;
  }

  get settled(): boolean {
    return Math.abs(this.value - this.target) < 0.05 && Math.abs(this.velocity) < 0.05;
  }
}
