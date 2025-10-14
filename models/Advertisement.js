const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  price: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Veículos', 'Imóveis', 'Eletrônicos', 'Móveis', 'Roupas', 'Serviços', 'Outros']
  },
  contact: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String, // URLs das imagens
    default: []
  }],
  userId: {
    type: String,
    required: true,
    index: true
  },
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  syncedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices para melhor performance
advertisementSchema.index({ userId: 1, createdAt: -1 });
advertisementSchema.index({ deviceId: 1, updatedAt: -1 });
advertisementSchema.index({ category: 1, createdAt: -1 });
advertisementSchema.index({ isDeleted: 1 });

// Método para converter para o formato do app
advertisementSchema.methods.toAppFormat = function() {
  return {
    id: this.id,
    title: this.title,
    description: this.description,
    price: this.price,
    category: this.category,
    contact: this.contact,
    images: this.images || [],
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

module.exports = mongoose.model('Advertisement', advertisementSchema);
