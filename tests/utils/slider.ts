import { Page, Locator } from '@playwright/test';

/**
 * 滑块验证配置
 */
export interface SliderConfig {
  /** 滑块选择器 */
  sliderSelector: string;
  /** 滑块轨道选择器 */
  trackSelector?: string;
  /** 滑动距离比例 (0-1)，默认 0.88 */
  distanceRatio?: number;
  /** 滑动步数，默认 25 */
  steps?: number;
  /** 每步间隔时间(ms)，默认 25 */
  stepDelay?: number;
}

/**
 * 滑块验证模块
 * 提供滑块验证的通用方法，可被其他测试脚本调用
 */
export class SliderVerification {
  private page: Page;
  private config: Required<SliderConfig>;

  constructor(page: Page, config: SliderConfig) {
    this.page = page;
    this.config = {
      sliderSelector: config.sliderSelector,
      trackSelector: config.trackSelector || config.sliderSelector,
      distanceRatio: config.distanceRatio ?? 0.88,
      steps: config.steps ?? 25,
      stepDelay: config.stepDelay ?? 25,
    };
  }

  /**
   * 执行滑块验证
   * @param retries 重试次数，默认 5
   */
  async verify(retries: number = 5): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`尝试滑块验证 ${attempt}/${retries}`);
        
        const slider = this.page.locator(this.config.sliderSelector);
        await slider.waitFor({ state: 'visible', timeout: 5000 });

        // 获取滑块元素的位置和大小
        const sliderBox = await slider.boundingBox();
        if (!sliderBox) {
          console.log('滑块元素未找到');
          continue;
        }

        console.log(`滑块位置: x=${sliderBox.x}, y=${sliderBox.y}`);

        // 获取滑块轨道的宽度
        let trackWidth = 418; // 默认轨道宽度
        
        if (this.config.trackSelector) {
          try {
            // 等待轨道元素可见
            const track = this.page.locator(this.config.trackSelector);
            await track.waitFor({ state: 'visible', timeout: 3000 });
            await this.page.waitForTimeout(500); // 额外等待确保渲染完成
            
            const trackBox = await track.boundingBox();
            if (trackBox && trackBox.width > 50) {
              trackWidth = trackBox.width - sliderBox.width;
              console.log(`轨道宽度: ${trackBox.width}, 滑块宽度: ${sliderBox.width}, 需滑动距离: ${trackWidth}`);
            } else {
              console.log(`轨道 boundingBox 无效，使用默认宽度`);
            }
          } catch (err) {
            console.log(`轨道元素等待超时: ${err}`);
          }
        }
        
        // 如果轨道宽度无效，跳过本次尝试
        if (trackWidth <= 0) {
          console.log('轨道宽度无效，等待后重试');
          await this.page.waitForTimeout(500);
          continue;
        }

        // 计算滑动距离，随机化一点避免检测
        const randomRatio = this.config.distanceRatio + (Math.random() - 0.5) * 0.05;
        const distance = trackWidth * randomRatio;

        // 执行滑动操作
        const success = await this.performSlide(slider, sliderBox, distance);
        
        if (success) {
          console.log('滑块验证成功');
          return true;
        }

        console.log('滑块验证失败，准备重试');
        await this.page.waitForTimeout(800);
        
      } catch (error) {
        console.log(`滑块验证出错: ${error}`);
        await this.page.waitForTimeout(800);
      }
    }

    return false;
  }

  /**
   * 执行滑动操作（模拟人类行为）
   */
  private async performSlide(
    slider: Locator,
    sliderBox: { x: number; y: number; width: number; height: number },
    distance: number
  ): Promise<boolean> {
    const startX = sliderBox.x + sliderBox.width / 2;
    const startY = sliderBox.y + sliderBox.height / 2;
    const endX = startX + distance;

    console.log(`开始滑动: 起点(${startX.toFixed(0)}, ${startY.toFixed(0)}), 终点(${endX.toFixed(0)}, ${startY.toFixed(0)})`);

    try {
      // 方法1：使用 mouse 事件配合更自然的轨迹
      await this.slideWithNaturalMouse(slider, startX, startY, distance);
      
      // 等待验证结果
      const success = await this.checkSlideSuccess(slider);
      if (success) {
        console.log('mouse 自然滑动成功');
        return true;
      }

      // 方法2：使用原生 touch 事件
      console.log('mouse 失败，尝试 touch');
      await this.slideWithTouch(slider, startX, startY, distance);
      
      const touchSuccess = await this.checkSlideSuccess(slider);
      if (touchSuccess) {
        console.log('touch 滑动成功');
        return true;
      }

      // 方法3：直接使用 evaluate 在页面内执行
      console.log('尝试页面内执行滑动');
      await this.slideInPage(slider, startX, startY, distance);
      
      const evalSuccess = await this.checkSlideSuccess(slider);
      return evalSuccess;
      
    } catch (error) {
      console.log(`滑动出错: ${error}`);
      return false;
    }
  }

  /**
   * 检查滑块验证是否成功
   */
  private async checkSlideSuccess(slider: Locator): Promise<boolean> {
    await this.page.waitForTimeout(800);
    
    // 方法1：检查 dv_text 文案是否变成"验证成功"（最可靠）
    try {
      const dvText = this.page.locator('.dv_text');
      const textContent = await dvText.textContent({ timeout: 1000 }) || '';
      console.log(`dv_text 文案: ${textContent}`);
      if (textContent.includes('验证成功')) {
        console.log('✓ 检测到"验证成功"文案');
        return true;
      }
    } catch {
      console.log('dv_text 元素未找到');
    }
    
    // 方法2：检查滑块容器的 class 是否包含成功标志
    try {
      const dragVerify = this.page.locator('.drag_verify, [class*="drag_verify"]');
      const className = await dragVerify.getAttribute('class') || '';
      if (className.includes('success') || className.includes('passed')) {
        console.log('✓ 检测到容器成功 class');
        return true;
      }
    } catch {
      // ignore
    }
    
    // 方法3：检查滑块是否变绿（通过 evaluate 检查背景色）
    try {
      const sliderBox = await slider.boundingBox();
      if (sliderBox) {
        // 检查滑块轨道是否变绿
        const isGreen = await this.page.evaluate(() => {
          const track = document.querySelector('.dv_progress_bar, .dv_content');
          if (!track) return false;
          const style = window.getComputedStyle(track);
          const bgColor = style.backgroundColor;
          console.log('轨道背景色:', bgColor);
          // 绿色范围
          return bgColor.includes('0, 128, 0') ||  // green
                 bgColor.includes('0, 255, 0') ||  // lime
                 bgColor.includes('34, 197, 94') || // Tailwind green-500
                 bgColor.includes('22, 163, 74') || // Tailwind green-600
                 bgColor.includes('16, 185, 129'); // Tailwind emerald-500
        });
        if (isGreen) {
          console.log('✓ 检测到滑块轨道变绿');
          return true;
        }
      }
    } catch {
      // ignore
    }
    
    console.log('✗ 滑块验证未成功');
    return false;
  }

  /**
   * 使用 touch 事件滑动
   */
  private async slideWithTouch(
    slider: Locator,
    startX: number,
    startY: number,
    distance: number
  ): Promise<void> {
    // 触发 touchstart
    await slider.dispatchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{ identifier: 0, clientX: startX, clientY: startY }],
    });

    // 分步 touchmove
    const steps = 12;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      const easeProgress = this.easeInOut(progress);
      const currentX = startX + distance * easeProgress;
      
      await slider.dispatchEvent('touchmove', {
        bubbles: true,
        cancelable: true,
        touches: [{ identifier: 0, clientX: currentX, clientY: startY + (Math.random() - 0.5) * 2 }],
      });
      
      await this.page.waitForTimeout(40 + Math.random() * 30);
    }

    // 触发 touchend
    await slider.dispatchEvent('touchend', {
      bubbles: true,
      cancelable: true,
    });
  }

  /**
   * 使用更自然的 mouse 轨迹滑动
   */
  private async slideWithNaturalMouse(
    slider: Locator,
    startX: number,
    startY: number,
    distance: number
  ): Promise<void> {
    console.log(`mouse 滑动: 从 ${startX.toFixed(0)} 滑动 ${distance.toFixed(0)} 像素`);
    
    // 移动到滑块上
    await this.page.mouse.move(startX, startY, { steps: 3 });
    await this.page.waitForTimeout(100);
    
    // 按下
    await this.page.mouse.down();
    await this.page.waitForTimeout(50);
    
    // 简单线性滑动，确保滑动到终点
    const steps = 25;
    for (let i = 1; i <= steps; i++) {
      const progress = i / steps;
      // 使用缓动函数
      const easeProgress = this.easeInOut(progress);
      const currentX = startX + distance * easeProgress;
      const jitter = (Math.random() - 0.5) * 2; // 轻微抖动
      
      await this.page.mouse.move(currentX, startY + jitter);
      await this.page.waitForTimeout(15 + Math.random() * 10);
    }
    
    console.log(`mouse 滑动完成，终点: ${(startX + distance).toFixed(0)}`);
    
    // 释放
    await this.page.waitForTimeout(50);
    await this.page.mouse.up();
  }

  /**
   * 在页面内直接执行滑动脚本
   */
  private async slideInPage(
    slider: Locator,
    startX: number,
    startY: number,
    distance: number
  ): Promise<void> {
    await this.page.evaluate(({ startX, startY, distance, selector }) => {
      const slider = document.querySelector(selector);
      if (!slider) return;
      
      const rect = slider.getBoundingClientRect();
      
      // 创建并触发事件
      const createEvent = (type: string, x: number, y: number) => {
        const event = new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
          view: window,
        });
        slider.dispatchEvent(event);
      };
      
      // mousedown
      createEvent('mousedown', startX, startY);
      
      // mousemove
      const steps = 15;
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const currentX = startX + distance * easeProgress;
        createEvent('mousemove', currentX, startY);
      }
      
      // mouseup
      const endX = startX + distance;
      createEvent('mouseup', endX, startY);
      
    }, { startX, startY, distance, selector: this.config.sliderSelector });
  }

  /**
   * 缓动函数
   */
  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  /**
   * 生成贝塞尔曲线轨迹点
   */
  private generateBezierCurve(
    startX: number,
    startY: number,
    distance: number,
    steps: number
  ): Array<{ x: number; y: number; delay: number }> {
    const points: Array<{ x: number; y: number; delay: number }> = [];
    
    // 控制点（用于生成曲线）
    const cp1x = startX + distance * 0.3;
    const cp1y = startY - 5 - Math.random() * 10;
    const cp2x = startX + distance * 0.7;
    const cp2y = startY + 5 + Math.random() * 10;
    const endX = startX + distance;
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      
      // 三次贝塞尔曲线
      const x = Math.pow(1-t, 3) * startX + 
                3 * Math.pow(1-t, 2) * t * cp1x + 
                3 * (1-t) * Math.pow(t, 2) * cp2x + 
                Math.pow(t, 3) * endX;
      
      const y = Math.pow(1-t, 3) * startY + 
                3 * Math.pow(1-t, 2) * t * cp1y + 
                3 * (1-t) * Math.pow(t, 2) * cp2y + 
                Math.pow(t, 3) * startY;
      
      points.push({
        x,
        y: y + (Math.random() - 0.5) * 2,
        delay: 25 + Math.random() * 25,
      });
    }
    
    return points;
  }

  /**
   * 模拟人类移动鼠标到目标位置
   */
  private async humanMove(targetX: number, targetY: number): Promise<void> {
    // 获取当前鼠标位置（假设从某个随机位置开始）
    const currentX = targetX - 50 - Math.random() * 100;
    const currentY = targetY + (Math.random() - 0.5) * 20;
    
    // 分几步移动过去
    const steps = 3 + Math.floor(Math.random() * 3);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = currentX + (targetX - currentX) * t;
      const y = currentY + (targetY - currentY) * t + (Math.random() - 0.5) * 2;
      await this.page.mouse.move(x, y);
      await this.page.waitForTimeout(20 + Math.random() * 30);
    }
  }

  /**
   * 生成人类滑动轨迹
   * 使用贝塞尔曲线模拟真实滑动
   */
  private generateHumanTrajectory(distance: number): Array<{ x: number; y: number; delay: number }> {
    const trajectory: Array<{ x: number; y: number; delay: number }> = [];
    const totalSteps = this.config.steps;
    
    // 分三个阶段：加速、匀速、减速
    const accelSteps = Math.floor(totalSteps * 0.3);  // 前30%加速
    const constSteps = Math.floor(totalSteps * 0.4);  // 中间40%匀速
    const decelSteps = totalSteps - accelSteps - constSteps;  // 最后减速

    let currentX = 0;
    
    // 加速阶段
    for (let i = 1; i <= accelSteps; i++) {
      const t = i / accelSteps;
      const easeT = t * t;  // 缓入
      currentX = distance * 0.3 * easeT;
      trajectory.push({
        x: currentX,
        y: (Math.random() - 0.5) * 2,
        delay: this.config.stepDelay + Math.random() * 15,
      });
    }
    
    // 匀速阶段
    const startConst = currentX;
    for (let i = 1; i <= constSteps; i++) {
      const t = i / constSteps;
      currentX = startConst + (distance * 0.5) * t;
      trajectory.push({
        x: currentX,
        y: (Math.random() - 0.5) * 2,
        delay: this.config.stepDelay + Math.random() * 10,
      });
    }
    
    // 减速阶段
    const startDecel = currentX;
    for (let i = 1; i <= decelSteps; i++) {
      const t = i / decelSteps;
      const easeT = 1 - (1 - t) * (1 - t);  // 缓出
      currentX = startDecel + (distance - startDecel) * easeT;
      trajectory.push({
        x: currentX,
        y: (Math.random() - 0.5) * 3,
        delay: this.config.stepDelay + 10 + Math.random() * 20,
      });
    }

    return trajectory;
  }

  /**
   * 静态方法：等待滑块出现并验证
   */
  static async handleSlider(
    page: Page,
    config: SliderConfig,
    retries: number = 5
  ): Promise<boolean> {
    const slider = new SliderVerification(page, config);
    return slider.verify(retries);
  }
}

/**
 * ERP滑块配置
 */
export const ERPSliderConfig: SliderConfig = {
  sliderSelector: '.dv_handler',
  trackSelector: '.drag_verify',
  distanceRatio: 1.05,  // 滑动到105%位置，确保滑到底
  steps: 35,
  stepDelay: 12,
};
