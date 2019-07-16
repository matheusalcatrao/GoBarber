import { Sequelize, Model } from 'sequelize';

class File extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        path: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );
  }
}

export default File;
