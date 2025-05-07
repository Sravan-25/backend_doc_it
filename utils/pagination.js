class PaginationHelper {
  static getDefaultPopulateOptions(modelName) {
    const populateMap = {
      Folder: [
        { path: 'createdBy', select: 'name email' },
        { path: 'parentId', select: 'name type' },
        { path: 'subfolders', select: 'name type' },
        { path: 'documents', select: 'name filePath uploadedAt' },
        { path: 'images', select: 'name filePath uploadedAt' },
      ],
      Document: [{ path: 'uploadedBy', select: 'name email' }],
      Image: [{ path: 'uploadedBy', select: 'name email' }],
      User: [
        { path: 'folders', select: 'name type' },
        { path: 'documents', select: 'name filePath uploadedAt' },
        { path: 'images', select: 'name filePath uploadedAt' },
      ],
    };
    return populateMap[modelName] || [];
  }

  static getPaginationParams(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  static getFilterOptions(query, modelName) {
    const baseFilters = {};

    if (query.search) {
      baseFilters.name = { $regex: query.search, $options: 'i' };
    }

    if (query.startDate && query.endDate) {
      baseFilters.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    switch (modelName) {
      case 'Folder':
        if (query.type) baseFilters.type = query.type;
        if (query.parentId) baseFilters.parentId = query.parentId;
        break;
      case 'Document':
      case 'Image':
        if (query.uploadedBy) baseFilters.uploadedBy = query.uploadedBy;
        break;
      case 'User':
        if (query.role) baseFilters.role = query.role;
        if (query.isVerified !== undefined)
          baseFilters.isVerified = query.isVerified;
        break;
    }

    return baseFilters;
  }

  static async paginateQuery(model, query = {}, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;
      const modelName = model.modelName;

      const defaultPopulate = this.getDefaultPopulateOptions(modelName);
      const filterOptions = this.getFilterOptions(query, modelName);

      const [data, total] = await Promise.all([
        model
          .find(filterOptions)
          .skip(skip)
          .limit(limit)
          .populate(options.populate || defaultPopulate)
          .select(options.select || '')
          .sort(options.sort || { createdAt: -1 }),
        model.countDocuments(filterOptions),
      ]);

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  static formatPaginationResponse(data, pagination) {
    return {
      data,
      meta: {
        pagination: {
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          pages: pagination.pages,
        },
      },
    };
  }
}

module.exports = PaginationHelper;
