import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private finalScore: number = 0;

  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data: { score?: number }) {
    this.finalScore = data.score || 0;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    for (let i = 0; i < 20; i++) {
      const rect = this.add.rectangle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(20, 100),
        Phaser.Math.Between(20, 100),
        0xffffff,
        Phaser.Math.FloatBetween(0.05, 0.2)
      );
      this.tweens.add({
        targets: rect,
        y: rect.y - Phaser.Math.Between(50, 150),
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const highscore = parseInt(localStorage.getItem('smash_em_highscore') || '0', 10);
    if (this.finalScore > highscore) localStorage.setItem('smash_em_highscore', this.finalScore.toString());
    const currentHighscore = Math.max(highscore, this.finalScore);

    this.add.text(width / 2, height / 2 - 140, 'SMASH EM', {
      fontSize: '84px',
      fontFamily: 'Impact',
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 10,
      shadow: { blur: 10, color: '#000000', fill: true, offsetY: 5 }
    }).setOrigin(0.5);

    const scorePanel = this.add.rectangle(width / 2, height / 2 - 10, 350, 110, 0x000000, 0.6);
    scorePanel.setStrokeStyle(4, 0x555555);

    if (this.finalScore) {
      this.add.text(width / 2, height / 2 - 35, `Final Score: ${Math.floor(this.finalScore)}`, {
        fontSize: '24px',
        fontFamily: 'Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    this.add.text(width / 2, height / 2 + 15, `Highscore: ${Math.floor(currentHighscore)}`, {
      fontSize: '32px',
      fontFamily: 'Arial',
      fontStyle: 'bold',
      color: '#ffdd00',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const btnContainer = this.add.container(width / 2, height / 2 + 130);

    const playBtnBg = this.add.rectangle(0, 0, 220, 70, 0x00aa00)
      .setInteractive({ useHandCursor: true });
    playBtnBg.setStrokeStyle(4, 0xffffff);
    
    const playBtnShadow = this.add.rectangle(5, 5, 220, 70, 0x000000, 0.4);

    const playText = this.add.text(0, 0, 'PLAY', {
      fontSize: '36px',
      fontFamily: 'Impact',
      color: '#ffffff',
      letterSpacing: 2
    }).setOrigin(0.5);

    btnContainer.add([playBtnShadow, playBtnBg, playText]);

    playBtnBg.on('pointerover', () => {
      playBtnBg.setFillStyle(0x00cc00);
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 100
      });
    });

    playBtnBg.on('pointerout', () => {
      playBtnBg.setFillStyle(0x00aa00);
      this.tweens.add({
        targets: btnContainer,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 100
      });
    });

    const startGame = () => {
      this.input.keyboard?.off('keydown-SPACE', startGame);
      this.input.keyboard?.off('keydown-ENTER', startGame);
      playBtnBg.disableInteractive();

      playBtnBg.setFillStyle(0x008800);
      this.tweens.add({
        targets: btnContainer,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.scene.start('MainScene');
        }
      });
    };

    playBtnBg.on('pointerdown', startGame);
    this.input.keyboard?.once('keydown-SPACE', startGame);
    this.input.keyboard?.once('keydown-ENTER', startGame);
  }
}
