import * as Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Rectangle {
  declare body: Phaser.Physics.Arcade.Body;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: any;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 40, 40, 0xff4444);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setCollideWorldBounds(true);

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasd = scene.input.keyboard.addKeys('W,A,S,D');
    } else {
      throw new Error('Keyboard plugin not active');
    }
  }

  update() {
    const speed = 300;
    const jumpForce = -800;

    if (this.cursors.left.isDown || this.wasd.A.isDown) this.body.setVelocityX(-speed);
    else if (this.cursors.right.isDown || this.wasd.D.isDown) this.body.setVelocityX(speed);
    else this.body.setVelocityX(0);

    if ((this.cursors.up.isDown || this.cursors.space.isDown || this.wasd.W.isDown) && this.body.touching.down) {
      this.body.setVelocityY(jumpForce);
    }
  }
}

