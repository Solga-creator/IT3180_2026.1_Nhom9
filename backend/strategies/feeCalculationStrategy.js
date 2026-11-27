import { AppError } from "../helpers/AppError.js";

/**
 * Base Interface & Concrete Strategies cho bài toán tính phí theo diện tích căn hộ (apartments.area).
 * Đóng vai trò Base Strategy Pattern để triển khai US-006 và US-008 ở Sprint 2.
 */
export class FeeCalculationStrategy {
  validateRate(_unitPrice) {
    throw new Error("Method validateRate() must be implemented by concrete strategy");
  }

  calculate(area, unitPrice) {
    const numericArea = Number(area);
    const numericRate = Number(unitPrice);
    if (!Number.isFinite(numericArea) || numericArea <= 0) {
      throw new AppError(400, "Diện tích căn hộ phải lớn hơn 0");
    }
    this.validateRate(numericRate);
    return Math.round(numericArea * numericRate);
  }
}

export class ServiceFeePerSqmStrategy extends FeeCalculationStrategy {
  validateRate(unitPrice) {
    if (!Number.isFinite(unitPrice) || unitPrice < 2500 || unitPrice > 16500) {
      throw new AppError(400, "Đơn giá phí dịch vụ chung cư phải nằm trong khoảng 2.500 - 16.500 đ/m²");
    }
  }
}

export class ManagementFeePerSqmStrategy extends FeeCalculationStrategy {
  validateRate(unitPrice) {
    if (!Number.isFinite(unitPrice) || unitPrice < 7000) {
      throw new AppError(400, "Đơn giá phí quản lý chung cư phải từ 7.000 đ/m² trở lên");
    }
  }
}

export const feeCalculationContext = Object.freeze({
  SERVICE_FEE: new ServiceFeePerSqmStrategy(),
  MANAGEMENT_FEE: new ManagementFeePerSqmStrategy(),
  calculateFee(feeTypeCode, area, unitPrice) {
    const strategy = this[feeTypeCode];
    if (!strategy) {
      throw new AppError(400, `Không hỗ trợ chiến lược tính phí cho loại phí: ${feeTypeCode}`);
    }
    return strategy.calculate(area, unitPrice);
  },
});
