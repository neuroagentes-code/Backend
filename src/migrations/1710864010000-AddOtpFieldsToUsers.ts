import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOtpFieldsToUsers1710864010000 implements MigrationInterface {
  name = 'AddOtpFieldsToUsers1710864010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add OTP code column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'otpCode',
        type: 'varchar',
        length: '6',
        isNullable: true,
        comment: 'OTP code for password recovery (6 digits)',
      }),
    );

    // Add OTP expiry column
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'otpExpiry',
        type: 'timestamp',
        isNullable: true,
        comment: 'OTP code expiration timestamp (5 minutes from creation)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove OTP expiry column
    await queryRunner.dropColumn('users', 'otpExpiry');
    
    // Remove OTP code column
    await queryRunner.dropColumn('users', 'otpCode');
  }
}
