import * as Phaser from 'phaser';

export class Player extends Phaser.GameObjects.Sprite {
    declare body: Phaser.Physics.Arcade.Body;
    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd: any;

    public hp: number = 20;
    public maxHp: number = 20;
    public totalXp: number = 0;
    public currentLevelStartXp: number = 0;
    public baseNextLevelXp: number = 10;
    public level: number = 1;

    public damage: number = 1;
    public jumpForce: number = -800;
    public speedLimit: number = 300;
    public acceleration: number = 3000;
    public maxJumps: number = 1;
    public jumpsLeft: number = 1;

    public hasBloodthirst: boolean = false;
    public jumpsRestoredOnBounce: number = 1;
    public critChance: number = 0;
    public critMultiplier: number = 2;
    public hasLongImmunity: boolean = false;
    public hasXpFromDamage: boolean = false;
    public hasGroundSlam: boolean = false;
    public xpReqFactor: number = 1.0;

    private isInvulnerable: boolean = false;
    public pendingLevelUps: number = 0;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'player-idle');
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(2.5);
        
        this.body.setCollideWorldBounds(true);

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
        this.body.setMaxVelocity(this.speedLimit, 1500);

        const deacceleration = 300;

        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.body.setAccelerationX(-this.acceleration);
            this.setFlipX(true);
            if (this.body.blocked.down || this.body.touching.down) {
                this.anims.play('player-walk', true);
            }
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.body.setAccelerationX(this.acceleration);
            this.setFlipX(false);
            if (this.body.blocked.down || this.body.touching.down) {
                this.anims.play('player-walk', true);
            }
        } else {
            if (this.body.acceleration.x > 0) {
                this.body.setAccelerationX(Math.max(this.body.acceleration.x - deacceleration, 0));
            } else if (this.body.acceleration.x < 0) {
                this.body.setAccelerationX(Math.min(this.body.acceleration.x + deacceleration, 0));
            }
            if (this.body.blocked.down || this.body.touching.down) {
                this.anims.play('player-idle', true);
            }
        }

        const isJumpJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
            Phaser.Input.Keyboard.JustDown(this.wasd.W);

        if (this.body.blocked.down || (this.body.touching.down && this.body.velocity.y === 0)) {
            this.jumpsLeft = this.maxJumps;
        } else {
            this.anims.play('player-idle', true);
        }

        if (isJumpJustDown && this.jumpsLeft > 0) {
            this.body.setVelocityY(this.jumpForce);
            this.jumpsLeft--;
        }
    }

    takeDamage(amount: number): boolean {
        if (this.isInvulnerable) return false;

        this.hp -= amount;
        if (this.hp <= 0) {
            (this.scene as any).gameOver(this.totalXp);
            return true;
        }
        this.scene.cameras.main.shake(150, 0.015);

        if (this.hasLongImmunity && Math.random() < 0.2) {
            this.isInvulnerable = true;

            this.scene.tweens.add({
                targets: this,
                alpha: 0.2,
                duration: 100,
                yoyo: true,
                repeat: 15,
                onComplete: () => {
                    this.alpha = 1;
                    this.isInvulnerable = false;
                }
            });
        }

        this.body.setVelocityY(-350);
        return true;
    }

    heal(amount: number) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    gainXp(amount: number) {
        this.totalXp += amount;
        
        while (this.totalXp >= this.currentLevelStartXp + (this.baseNextLevelXp * this.xpReqFactor)) {
            this.currentLevelStartXp += (this.baseNextLevelXp * this.xpReqFactor);
            this.level++;
            this.baseNextLevelXp = Math.floor(this.baseNextLevelXp * 1.5);

            this.scene.cameras.main.flash(250, 255, 255, 255);

            this.pendingLevelUps++;
        }
    }
}


