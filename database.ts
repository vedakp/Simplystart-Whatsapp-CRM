import { Sequelize, DataTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

let sequelize: Sequelize | null = null;
export const models: any = {};

export async function connectDB(config: any) {
  if (sequelize) {
    await sequelize.close();
  }
  
  const finalHost = config.host === 'localhost' ? '127.0.0.1' : config.host;
  sequelize = new Sequelize(config.database, config.user, config.password, {
    host: finalHost,
    port: parseInt(config.port) || 3306,
    dialect: 'mysql',
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully.');
    
    // Define models
    models.Setting = sequelize.define('Setting', {
      key: { type: DataTypes.STRING, primaryKey: true },
      value: { type: DataTypes.JSON }
    });

    models.Contact = sequelize.define('Contact', {
      id: { type: DataTypes.STRING, primaryKey: true },
      jid: DataTypes.STRING,
      name: DataTypes.STRING,
      profilePic: DataTypes.TEXT,
      tags: DataTypes.JSON
    });

    models.Lead = sequelize.define('Lead', {
      id: { type: DataTypes.STRING, primaryKey: true },
      name: DataTypes.STRING,
      status: DataTypes.STRING,
      value: DataTypes.FLOAT,
      notes: DataTypes.TEXT,
      contactInfo: DataTypes.STRING,
      createdAt: DataTypes.STRING,
      updatedAt: DataTypes.STRING
    });

    models.Order = sequelize.define('Order', {
      id: { type: DataTypes.STRING, primaryKey: true },
      customerName: DataTypes.STRING,
      customerPhone: DataTypes.STRING,
      items: DataTypes.JSON,
      totalAmount: DataTypes.FLOAT,
      status: DataTypes.STRING,
      logs: DataTypes.JSON,
      createdAt: DataTypes.STRING
    });

    models.Campaign = sequelize.define('Campaign', {
      id: { type: DataTypes.STRING, primaryKey: true },
      name: DataTypes.STRING,
      messageTemplate: DataTypes.TEXT,
      targets: DataTypes.INTEGER,
      status: DataTypes.STRING,
      createdAt: DataTypes.STRING
    });

    models.Note = sequelize.define('Note', {
      id: { type: DataTypes.STRING, primaryKey: true },
      title: DataTypes.STRING,
      content: DataTypes.TEXT,
      updatedAt: DataTypes.STRING
    });
    
    // Not explicitly mentioned but good for Campaigns mapping
    models.Group = sequelize.define('Group', {
      id: { type: DataTypes.STRING, primaryKey: true },
      jid: DataTypes.STRING,
      name: DataTypes.STRING,
      profilePic: DataTypes.TEXT
    });

    await sequelize.sync({ alter: true });
    console.log('MySQL tables synchronized.');
    return { success: true, message: 'Connected and tables synchronized.' };
  } catch (error: any) {
    console.error('MySQL Connection Error:', error.message);
    models.Contact = null;
    models.Lead = null;
    models.Order = null;
    models.Campaign = null;
    models.Note = null;
    models.Setting = null;
    models.Group = null;
    sequelize = null;
    return { success: false, message: error.message };
  }
}

export function isDBConnected() {
  return sequelize !== null;
}
