import { DataSource } from 'typeorm';
import { getDataSourceOptions } from '../src/database/typeorm.options';

export default new DataSource({
  ...getDataSourceOptions(),
  migrations: ['database/migrations/*.ts'],
});
