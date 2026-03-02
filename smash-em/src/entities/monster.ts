import * as Phaser from 'phaser';
import { Player } from './player';

export interface MonsterConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  speed: number;
  jumpForce: number;
  hp: number;
  damage: number;
  player: Player;
}

export class BaseMonster extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.Body;
  
  public hp: number;
  protected speed: number;
  public damage: number;
  protected jumpForce: number;
  protected player: Player;
  private jumpCooldown: number = 0;

  constructor(config: MonsterConfig) {
    super(config.scene, config.x, config.y, config.width, config.height, config.color);
    
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    
    this.body.setCollideWorldBounds(true);
    
    this.hp = config.hp;
    this.speed = config.speed;
    this.jumpForce = config.jumpForce;
    this.damage = config.damage;
    this.player = config.player;
  }

  update(time: number, delta: number) {
    if (this.hp <= 0 || !this.active) return;

    const distanceX = this.player.x - this.x;
    const distanceY = this.player.y - this.y;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
    
    if (distanceX > 10) this.body.setVelocityX(this.speed);
    else if (distanceX < -10) this.body.setVelocityX(-this.speed);
    else this.body.setVelocityX(0);

    this.jumpCooldown -= delta;
    if (this.body.touching.down && this.jumpCooldown <= 0) {
      if (distance < 250 && (distanceY < -50 || Math.random() < 0.1)) {
        this.body.setVelocityY(this.jumpForce);
        this.jumpCooldown = 1000 + Math.random() * 1500;
      }
    }
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  die() {
    this.destroy();
  }
}

export class BasicSlime extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({
      scene,
      x,
      y,
      width: 30,
      height: 30,
      color: 0x00ff00,
      speed: 150,
      jumpForce: -600,
      hp: 1,
      damage: 2,
      player
    });
  }
}