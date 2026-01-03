// Pagination utility functions

export const getPaginationParams = (req) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

export const buildSortClause = (sortBy, order = 'DESC', allowedFields = []) => {
  if (!sortBy || !allowedFields.includes(sortBy)) {
    return 'created_at DESC';
  }
  
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return `${sortBy} ${sortOrder}`;
};

export const buildWhereClause = (filters, user, table = '') => {
  const conditions = [];
  const params = [];
  
  // Add soft delete filter
  conditions.push(`${table ? table + '.' : ''}deleted_at IS NULL`);
  
  // Add user access control
  if (user.role !== 'HR' && user.role !== 'manager') {
    conditions.push(`${table ? table + '.' : ''}employee_id = ?`);
    params.push(user.id);
  }
  
  // Add date range filter
  if (filters.startDate) {
    conditions.push(`${table ? table + '.' : ''}date >= ?`);
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    conditions.push(`${table ? table + '.' : ''}date <= ?`);
    params.push(filters.endDate);
  }
  
  // Add status filter (if applicable)
  if (filters.status) {
    conditions.push(`${table ? table + '.' : ''}status = ?`);
    params.push(filters.status);
  }
  
  // Add mood filter (if applicable)
  if (filters.mood) {
    conditions.push(`${table ? table + '.' : ''}mood = ?`);
    params.push(filters.mood);
  }
  
  // Add search filter (if applicable)
  if (filters.search) {
    conditions.push(`(
      ${table ? table + '.' : ''}task_description LIKE ? OR 
      ${table ? table + '.' : ''}skill_name LIKE ? OR 
      ${table ? table + '.' : ''}comments LIKE ?
    )`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  return { whereClause, params };
};

export const getPaginationMeta = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: totalCount,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage
  };
};

export const buildPaginatedResponse = (data, page, limit, totalCount) => {
  return {
    data,
    pagination: getPaginationMeta(page, limit, totalCount)
  };
};
