import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { sequelize } from '../db/sequelize';

export class Brief extends Model<InferAttributes<Brief>, InferCreationAttributes<Brief>> {
  declare id: CreationOptional<string>;
  declare niche: string;
  declare tone: string;
  declare audience: string;
  declare goals: string;
  declare schedule: string;
  declare competitors: string;
  declare keywords: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Brief.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    niche: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    tone: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    audience: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    goals: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    schedule: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    competitors: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    keywords: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'briefs' },
);

export class Idea extends Model<InferAttributes<Idea>, InferCreationAttributes<Idea>> {
  declare id: CreationOptional<string>;
  declare briefId: string;
  declare num: number;
  declare hook: string;
  declare concept: string;
  declare format: string;
  declare duration: string;
  declare cta: string;
  declare score: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare brief?: NonAttribute<Brief>;
}

Idea.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    briefId: { type: DataTypes.UUID, allowNull: false },
    num: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    hook: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    concept: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    format: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    duration: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    cta: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'ideas' },
);

export class Script extends Model<InferAttributes<Script>, InferCreationAttributes<Script>> {
  declare id: CreationOptional<string>;
  declare ideaId: string;
  declare duration: string;
  declare style: string;
  declare content: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Script.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ideaId: { type: DataTypes.UUID, allowNull: false },
    duration: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    style: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
    content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'scripts' },
);

export class Caption extends Model<InferAttributes<Caption>, InferCreationAttributes<Caption>> {
  declare id: CreationOptional<string>;
  declare ideaId: string;
  declare platform: string;
  declare caption: string;
  declare hashtags: string[];
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Caption.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    ideaId: { type: DataTypes.UUID, allowNull: false },
    platform: { type: DataTypes.STRING, allowNull: false },
    caption: { type: DataTypes.TEXT, allowNull: false },
    hashtags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'captions' },
);

export class Analytics extends Model<InferAttributes<Analytics>, InferCreationAttributes<Analytics>> {
  declare id: CreationOptional<string>;
  declare briefId: string | null;
  declare metricsInput: string;
  declare aiAnalysis: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Analytics.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    briefId: { type: DataTypes.UUID, allowNull: true },
    metricsInput: { type: DataTypes.TEXT, allowNull: false },
    aiAnalysis: { type: DataTypes.TEXT, allowNull: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'analytics' },
);

export class SessionState extends Model<InferAttributes<SessionState>, InferCreationAttributes<SessionState>> {
  declare id: CreationOptional<string>;
  declare activeBriefId: string | null;
  declare checklist: boolean[];
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

SessionState.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    activeBriefId: { type: DataTypes.UUID, allowNull: true },
    checklist: { type: DataTypes.ARRAY(DataTypes.BOOLEAN), allowNull: false, defaultValue: [false, false, false, false, false, false] },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'session_state' },
);

Brief.hasMany(Idea, { foreignKey: 'briefId', as: 'ideas', onDelete: 'CASCADE' });
Idea.belongsTo(Brief, { foreignKey: 'briefId', as: 'brief' });
Idea.hasMany(Script, { foreignKey: 'ideaId', as: 'scripts', onDelete: 'CASCADE' });
Script.belongsTo(Idea, { foreignKey: 'ideaId', as: 'idea' });
Idea.hasMany(Caption, { foreignKey: 'ideaId', as: 'captions', onDelete: 'CASCADE' });
Caption.belongsTo(Idea, { foreignKey: 'ideaId', as: 'idea' });

export const syncDatabase = async () => {
  await sequelize.sync();
};
