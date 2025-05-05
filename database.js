module.exports = (sequelize, DataTypes) => {
  const Like = sequelize.define('Like', {
    breedId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  return Like;
};