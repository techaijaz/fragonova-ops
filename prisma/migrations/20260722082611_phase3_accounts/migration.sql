-- CreateTable
CREATE TABLE `shipments` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `awb` VARCHAR(191) NULL,
    `courierCompanyId` INTEGER NULL,
    `courierName` VARCHAR(191) NULL,
    `status` ENUM('CREATED', 'AWB_ASSIGNED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RTO', 'RTO_DELIVERED') NOT NULL DEFAULT 'CREATED',
    `weight` DOUBLE NULL,
    `length` DOUBLE NULL,
    `breadth` DOUBLE NULL,
    `height` DOUBLE NULL,
    `shippingCharge` DOUBLE NULL,
    `pickupScheduled` BOOLEAN NOT NULL DEFAULT false,
    `pickupDate` DATETIME(3) NULL,
    `labelUrl` VARCHAR(191) NULL,
    `manifestUrl` VARCHAR(191) NULL,
    `channelOrderId` INTEGER NULL,
    `shiprocketOrderId` INTEGER NULL,
    `trackingUrl` VARCHAR(191) NULL,
    `shippingAddress` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `shipments_orderId_key`(`orderId`),
    UNIQUE INDEX `shipments_awb_key`(`awb`),
    INDEX `shipments_orderId_idx`(`orderId`),
    INDEX `shipments_awb_idx`(`awb`),
    INDEX `shipments_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` VARCHAR(191) NOT NULL,
    `category` VARCHAR(72) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `expenseDate` DATETIME(3) NOT NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `expenses_category_expenseDate_idx`(`category`, `expenseDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_charges` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `shippingCharge` DOUBLE NOT NULL DEFAULT 0,
    `gatewayCharge` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `order_charges_orderId_key`(`orderId`),
    INDEX `order_charges_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `remittances` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `shiprocketSettlementId` VARCHAR(191) NULL,
    `amount` DOUBLE NOT NULL,
    `settlementDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(24) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `remittances_shiprocketSettlementId_key`(`shiprocketSettlementId`),
    INDEX `remittances_orderId_idx`(`orderId`),
    INDEX `remittances_settlementDate_idx`(`settlementDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `shipments` ADD CONSTRAINT `shipments_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_charges` ADD CONSTRAINT `order_charges_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `remittances` ADD CONSTRAINT `remittances_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
