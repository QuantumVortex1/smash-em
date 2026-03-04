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
  killXP: number;
  player: Player;
}

export class BaseMonster extends Phaser.GameObjects.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  
  public hp: number;
  public killXP: number;
  protected speed: number;
  public damage: number;
  protected jumpForce: number;
  protected player: Player;
  private jumpCooldown: number = 0;
  protected textureKey: string;
  private preferredOffset: number = 0;
  private isFrozen: boolean = false;
  private frozenTime: number = 0;

  constructor(config: MonsterConfig) {
    super(config.scene, config.x, config.y, config.textureKey);
    
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
    
    this.setScale(3);
    this.body.setCollideWorldBounds(true);
    this.body.setBounceY(0.3); 
    
    this.textureKey = config.textureKey;
    this.hp = config.hp;
    this.speed = config.speed;
    this.jumpForce = config.jumpForce;
    this.damage = config.damage;
    this.killXP = config.killXP;
    this.player = config.player;
  }

  update(time: number, delta: number) {
    if (this.hp <= 0 || !this.active) return;

    const distanceX = this.player.x - this.x;
    const distanceY = this.player.y - this.y;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
    
    this.anims.play(`${this.textureKey}-anim`, true);

    if (this.isFrozen) {
      if (this.scene.time.now >= this.frozenTime) {
        this.isFrozen = false;
        this.clearTint();
      } else {
        this.body.setVelocityX(0);
        return;
      }
    }

    if (!this.preferredOffset) this.preferredOffset = (80 + Math.random() * 100);

    let targetX = this.player.x;

    if (this.player.y < this.y - 30) {
      const side = (distanceX > 0) ? -1 : 1; 
      targetX = this.player.x + ((this as any).preferredOffset * side);
    } else {
      targetX = this.player.x;
      if (Math.random() < 0.02) this.preferredOffset = (80 + Math.random() * 100);
    }

    const diffToTarget = targetX - this.x;
    const isGrounded = this.body.touching.down || this.body.blocked.down;

    if (isGrounded) {
      if (diffToTarget > 15) {
        this.body.setVelocityX(this.speed);
        this.setFlipX(false);
      } else if (diffToTarget < -15) {
        this.body.setVelocityX(-this.speed);
        this.setFlipX(true);
      } else {
        this.body.setVelocityX(0);
        this.setFlipX(distanceX < 0);
      }
    }

    this.jumpCooldown -= delta;
    if (isGrounded && this.jumpCooldown <= 0) {
      if (distance < 350) {
        if (distanceY < -20 || (Math.abs(diffToTarget) <= 20 && Math.abs(distanceX) < 200)) {
             const variedJumpForce = this.jumpForce * (0.8 + Math.random() * 0.4);
             this.body.setVelocityY(variedJumpForce);
             
             const jumpSpeedX = (distanceX > 0 ? 1 : -1) * (this.speed * 1.05);
             this.body.setVelocityX(jumpSpeedX);
             
             this.jumpCooldown = 600 + Math.random() * 800;
        }
      }
    }
  }

  takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.die();
      return true;
    }
    if (this.player.hasFrostBite && Math.random() < 0.3) {
      this.isFrozen = true;
      this.frozenTime = this.scene.time.now + 2000;
      this.setTint(0x99d9ea);
      this.body.setVelocityX(0);
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
    super({ scene, x, y, textureKey: 'bloodshot-eye', speed: 80, jumpForce: -400, hp: 1, damage: 1, killXP: 3, player });
  }
}

export class OcularWatcher extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'ocular-watcher', speed: 100, jumpForce: -450, hp: 3, damage: 2, killXP: 6, player });
  }
}

export class OchreJelly extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'ochre-jelly', speed: 120, jumpForce: -550, hp: 6, damage: 3, killXP: 10, player });
  }
}

export class DeathSlime extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'death-slime', speed: 150, jumpForce: -630, hp: 12, damage: 5, killXP: 16, player });
  }
}

export class MurkySlaad extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'murky-slaad', speed: 180, jumpForce: -750, hp: 25, damage: 8, killXP: 25, player });
  }
}

export class CrimsonSlaad extends BaseMonster {
  constructor(scene: Phaser.Scene, x: number, y: number, player: Player) {
    super({ scene, x, y, textureKey: 'crimson-slaad', speed: 200, jumpForce: -900, hp: 40, damage: 15, killXP: 35, player });
  }
}