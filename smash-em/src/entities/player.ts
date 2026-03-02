import * as Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.Body;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: any;

  public hp: number = 20;
  public maxHp: number = 20;
  public xp: number = 0;
  public maxXp: number = 10;
  public level: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 40, 40, 0xff4444);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCollideWorldBounds(true);

    this.body.setMaxVelocity(300, 1500);
    this.body.setDragX(1500);
    this.body.setBounceY(0.2);

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = scene.input.keyboard.addKeys('W,A,S,D');
    } else {
      throw new Error('Keyboard plugin not active');
    }
  }

  update() {
    const acceleration = 3000;
    const deacceleration = 300;
    const jumpForce = -800;

    if (this.cursors.left.isDown || this.wasd.A.isDown) this.body.setAccelerationX(-acceleration);
    else if (this.cursors.right.isDown || this.wasd.D.isDown) this.body.setAccelerationX(acceleration);
    else {
        if (this.body.acceleration.x > 0) {
            this.body.setAccelerationX(Math.max(this.body.acceleration.x - deacceleration, 0));
        } else if (this.body.acceleration.x < 0) {
            this.body.setAccelerationX(Math.min(this.body.acceleration.x + deacceleration, 0));
        }
    }

    if ((this.cursors.up.isDown || this.cursors.space.isDown || this.wasd.W.isDown) && this.body.touching.down) {
      this.body.setVelocityY(jumpForce);
    }
  }

takeDamage(amount: number): boolean {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.scene.scene.restart();
      return true;
    }
    this.scene.cameras.main.shake(150, 0.005);

    this.scene.tweens.add({
      targets: this,
      alpha: 0.2,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.alpha = 1;
      }
    });

    this.body.setVelocityY(-350);
    return true;
  }

  gainXp(amount: number) {
    this.xp += amount;
    if (this.xp >= this.maxXp) {
      this.xp = 0;
      this.level++;
      this.hp = Math.min(this.maxHp, Math.round(this.hp * 1.5));
      this.maxXp = Math.floor(this.maxXp * 1.5);
      
      this.scene.cameras.main.flash(250, 255, 255, 255);
    }
  }
}

