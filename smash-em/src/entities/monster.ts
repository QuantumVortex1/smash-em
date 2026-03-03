import * as Phaser from 'phaser';
import { Player } from './player';

export interface MonsterConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  textureKey: string;
  speed: number;
  jumpForce: number;
  hp: number;
  damage: number;
  player: Player;
}

export class BaseMonster extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  
  public hp: number;
  protected speed: number;
  public damage: number;
  protected jumpForce: number;
  protected player: Player;
  private jumpCooldown: number = 0;
  protected textureKey: string;

  constructor(config: MonsterConfig) {
    super(config.scene, config.x, config.y, config.textureKey);
    
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    
    this.setScale(2.5);
    this.body.setCollideWorldBounds(true);
    this.body.setBounceY(0.3); 
    
    this.textureKey = config.textureKey;
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
    
    this.anims.play(`${this.textureKey}-anim`, true);

    if (distanceX > 10) {
      this.body.setVelocityX(this.speed);
      this.setFlipX(false);
    } else if (distanceX < -10) {
      this.body.setVelocityX(-this.speed);
      this.setFlipX(true);
    } else {
      this.body.setVelocityX(0);
    }

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
    this.setActive(false);
    this.setVisible(false);
    if (this.body) this.body.enable = false;
    this.destroy();
  }
}

export class BloodshotEye extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'bloodshot-eye', speed: 100, jumpForce: -400, hp: 1, damage: 1, player });
  }
}

export class OcularWatcher extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'ocular-watcher', speed: 120, jumpForce: -450, hp: 3, damage: 2, player });
  }
}

export class OchreJelly extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'ochre-jelly', speed: 150, jumpForce: -550, hp: 6, damage: 3, player });
  }
}

export class DeathSlime extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'death-slime', speed: 180, jumpForce: -650, hp: 10, damage: 5, player });
  }
}

export class MurkySlaad extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'murky-slaad', speed: 220, jumpForce: -720, hp: 17, damage: 7, player });
  }
}

export class CrimsonSlaad extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'crimson-slaad', speed: 250, jumpForce: -850, hp: 25, damage: 10, player });
  }
}