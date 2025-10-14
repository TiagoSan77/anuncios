const express = require('express');
const Advertisement = require('../models/Advertisement');
const Device = require('../models/Device');
const router = express.Router();

// Middleware para validar deviceId
const validateDevice = async (req, res, next) => {
  try {
    const { deviceId, userId } = req.body;
    
    if (!deviceId || !userId) {
      return res.status(400).json({ 
        error: 'deviceId e userId são obrigatórios' 
      });
    }

    // Registrar ou atualizar dispositivo
    await Device.findOneAndUpdate(
      { deviceId },
      { 
        userId, 
        lastSync: new Date(),
        platform: req.body.platform || 'android'
      },
      { upsert: true, new: true }
    );

    req.deviceId = deviceId;
    req.userId = userId;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/advertisements - Buscar todos os anúncios do usuário
router.get('/', async (req, res) => {
  try {
    const { userId, deviceId, lastSync } = req.query;

    if (!userId || !deviceId) {
      return res.status(400).json({ 
        error: 'userId e deviceId são obrigatórios' 
      });
    }

    let query = { userId, isDeleted: false };
    
    // Se informar lastSync, buscar apenas alterações após essa data
    if (lastSync) {
      query.updatedAt = { $gt: new Date(lastSync) };
    }

    const advertisements = await Advertisement
      .find(query)
      .sort({ createdAt: -1 })
      .limit(1000); // Limite de segurança

    const result = advertisements.map(ad => ad.toAppFormat());

    res.json({
      success: true,
      data: result,
      count: result.length,
      syncTime: new Date()
    });

  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/advertisements - Criar novo anúncio
router.post('/', validateDevice, async (req, res) => {
  try {
    const { id, title, description, price, category, contact, images } = req.body;

    // Validações básicas
    if (!title || !description || !price || !category || !contact) {
      return res.status(400).json({ 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      });
    }

    // Verificar se já existe
    const existing = await Advertisement.findOne({ id, userId: req.userId });
    if (existing) {
      return res.status(409).json({ 
        error: 'Anúncio já existe' 
      });
    }

    const advertisement = new Advertisement({
      id: id || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      price,
      category,
      contact,
      images: images || [],
      userId: req.userId,
      deviceId: req.deviceId
    });

    await advertisement.save();

    res.status(201).json({
      success: true,
      data: advertisement.toAppFormat()
    });

  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Anúncio já existe' });
    }
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/advertisements/:id - Atualizar anúncio
router.put('/:id', validateDevice, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category, contact, images } = req.body;

    const advertisement = await Advertisement.findOneAndUpdate(
      { id, userId: req.userId, isDeleted: false },
      {
        title,
        description,
        price,
        category,
        contact,
        images,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!advertisement) {
      return res.status(404).json({ error: 'Anúncio não encontrado' });
    }

    res.json({
      success: true,
      data: advertisement.toAppFormat()
    });

  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/advertisements/:id - Deletar anúncio (soft delete)
router.delete('/:id', validateDevice, async (req, res) => {
  try {
    const { id } = req.params;

    const advertisement = await Advertisement.findOneAndUpdate(
      { id, userId: req.userId },
      { 
        isDeleted: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!advertisement) {
      return res.status(404).json({ error: 'Anúncio não encontrado' });
    }

    res.json({
      success: true,
      message: 'Anúncio deletado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar anúncio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/advertisements/sync - Sincronização em lote
router.post('/sync', validateDevice, async (req, res) => {
  try {
    const { advertisements, lastSync } = req.body;

    if (!Array.isArray(advertisements)) {
      return res.status(400).json({ error: 'advertisements deve ser um array' });
    }

    const results = {
      created: 0,
      updated: 0,
      errors: []
    };

    // Processar cada anúncio
    for (const adData of advertisements) {
      try {
        const existing = await Advertisement.findOne({ 
          id: adData.id, 
          userId: req.userId 
        });

        if (existing) {
          // Atualizar se a versão local é mais recente
          const localDate = new Date(adData.updatedAt);
          const serverDate = new Date(existing.updatedAt);
          
          if (localDate > serverDate) {
            await Advertisement.findOneAndUpdate(
              { id: adData.id, userId: req.userId },
              {
                ...adData,
                userId: req.userId,
                deviceId: req.deviceId,
                updatedAt: new Date()
              }
            );
            results.updated++;
          }
        } else {
          // Criar novo
          const advertisement = new Advertisement({
            ...adData,
            userId: req.userId,
            deviceId: req.deviceId
          });
          await advertisement.save();
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          id: adData.id,
          error: error.message
        });
      }
    }

    // Buscar mudanças do servidor
    let serverChanges = [];
    if (lastSync) {
      serverChanges = await Advertisement
        .find({
          userId: req.userId,
          updatedAt: { $gt: new Date(lastSync) }
        })
        .sort({ updatedAt: -1 });
    }

    res.json({
      success: true,
      results,
      serverChanges: serverChanges.map(ad => ad.toAppFormat()),
      syncTime: new Date()
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/advertisements/stats - Estatísticas do usuário
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    const stats = await Advertisement.aggregate([
      { $match: { userId, isDeleted: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Advertisement.countDocuments({ userId, isDeleted: false });
    
    res.json({
      success: true,
      data: {
        total,
        byCategory: stats,
        lastUpdate: new Date()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
