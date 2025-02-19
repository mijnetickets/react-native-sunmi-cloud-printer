//
//  SunmiIpPrinterModel.h
//  SMPrinterSDKProject
//
//  Created by SM2368 on 2022/10/28.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface SunmiIpPrinterModel : NSObject

/**
 * 设备 IP
 */
@property (nonatomic, copy) NSString *deviceIP;

/**
 * 设备端口
 */
@property (nonatomic, strong) NSNumber *devicePort;

/**
 * 设备名称
 */
@property (nonatomic, copy) NSString *deviceName;

/**
 * 设备 Mode
 */
@property (nonatomic, copy) NSString *deviceMode __attribute__((deprecated("This property is deprecated")));

/**
 * 设备 SN
 */
@property (nonatomic, copy) NSString *deviceSN __attribute__((deprecated("This property is deprecated")));;


@end

NS_ASSUME_NONNULL_END
