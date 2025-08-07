const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');

// GET /api/visitors - Fetch all visitors with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    // Type filter
    if (req.query.type) {
      filter.type = new RegExp(req.query.type, 'i');
    }
    
    // Host filter
    if (req.query.host) {
      filter.host = new RegExp(req.query.host, 'i');
    }
    
    // Search filter
    if (req.query.search) {
      filter.$or = [
        { full_name: new RegExp(req.query.search, 'i') },
        { visitor_name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { host: new RegExp(req.query.search, 'i') },
        { cnic: new RegExp(req.query.search, 'i') },
        { visitor_cnic: new RegExp(req.query.search, 'i') },
        { phone: new RegExp(req.query.search, 'i') },
        { visitor_phone: new RegExp(req.query.search, 'i') },
        { purpose: new RegExp(req.query.search, 'i') }
      ];
    }
    
    // Date range filter - Enhanced logic
    if (req.query.startDate || req.query.endDate) {
      const dateFilter = {};
      
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        startDate.setHours(0, 0, 0, 0); // Start of day
        dateFilter.$gte = startDate;
      }
      
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        dateFilter.$lte = endDate;
      }
      
      // Apply date filter to both entry_time and timestamp fields
      filter.$or = [
        { entry_time: dateFilter },
        { timestamp: dateFilter }
      ];
      
      // If we also have a search filter, combine them properly
      if (req.query.search) {
        const searchFilter = filter.$or;
        filter.$and = [
          {
            $or: [
              { entry_time: dateFilter },
              { timestamp: dateFilter }
            ]
          },
          {
            $or: searchFilter
          }
        ];
        delete filter.$or;
      }
    }

    // Get all matching visitors first, then sort in JavaScript for more reliable sorting
    const allVisitors = await Visitor.find(filter).lean();
    
    // Sort in JavaScript to handle mixed date types properly
    allVisitors.sort((a, b) => {
      // Get the effective date for each visitor
      const getEffectiveDate = (visitor) => {
        const date = visitor.entry_time || visitor.timestamp;
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        return new Date(0); // Fallback for invalid dates
      };
      
      const dateA = getEffectiveDate(a);
      const dateB = getEffectiveDate(b);
      
      // Sort by date descending (most recent first)
      const dateDiff = dateB.getTime() - dateA.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      // Fallback to _id sorting
      return b._id.toString().localeCompare(a._id.toString());
    });

    // Apply pagination after sorting
    const visitors = allVisitors.slice(skip, skip + limit);
    const total = allVisitors.length;

    // Transform data to match your Python processing
    const transformedVisitors = visitors.map(visitor => ({
      _id: visitor._id,
      Type: visitor.type,
      Name: visitor.full_name || visitor.visitor_name || 'Unknown',
      CNIC: visitor.cnic || visitor.visitor_cnic || 'Not provided',
      Email: visitor.email || 'Not provided',
      Phone: visitor.phone || visitor.visitor_phone || 'Not provided',
      Host: visitor.host,
      Purpose: visitor.purpose,
      EntryTime: visitor.entry_time || visitor.timestamp
    }));

    res.json({
      visitors: transformedVisitors,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch visitors',
      message: error.message
    });
  }
});

// GET /api/visitors/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

        // Start of week (Monday)
        const firstDayOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        // If Sunday (0), set to previous Monday
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        firstDayOfWeek.setDate(today.getDate() + diffToMonday);
        firstDayOfWeek.setHours(0, 0, 0, 0);
        

        // Start of month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        // Start of next month
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        firstDayOfNextMonth.setHours(0, 0, 0, 0);

    const [
      totalVisitors,
      todayVisitors,
      weeklyVisitors,
      monthlyVisitors,
      typeStats,
      topHosts
    ] = await Promise.all([
      Visitor.countDocuments(),
      Visitor.countDocuments({
        $or: [
          { entry_time: { $gte: today, $lt: tomorrow } },
          { timestamp: { $gte: today, $lt: tomorrow } }
        ]
      }),
            Visitor.countDocuments({
                $or: [
                    { entry_time: { $gte: firstDayOfWeek, $lt: tomorrow } },
                    { timestamp: { $gte: firstDayOfWeek, $lt: tomorrow } }
                ]
            }),
            Visitor.countDocuments({
                $or: [
                    { entry_time: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth } },
                    { timestamp: { $gte: firstDayOfMonth, $lt: firstDayOfNextMonth } }
                ]
            }),
      Visitor.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Visitor.aggregate([
        { $group: { _id: '$host', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      totalVisitors,
      todayVisitors,
      weeklyVisitors,
      monthlyVisitors,
      typeStats,
      topHosts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

// GET /api/visitors/chart-data - Chart data for dashboard
router.get('/chart-data', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const dailyVisitors = await Visitor.aggregate([
      {
        $match: {
          $or: [
            { entry_time: { $gte: startDate } },
            { timestamp: { $gte: startDate } }
          ]
        }
      },
      {
        $addFields: {
          effectiveDate: {
            $ifNull: ['$entry_time', '$timestamp']
          }
        }
      },
      {
        $addFields: {
          date: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: '$effectiveDate'
            }
          }
        }
      },
      {
        $group: {
          _id: '$date',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(dailyVisitors);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chart data',
      message: error.message
    });
  }
});

// GET /api/visitors/export - Export filtered data
router.get('/export', async (req, res) => {
  try {
    // Build the same filter logic as the main endpoint
    const filter = {};
    
    if (req.query.type) {
      filter.type = new RegExp(req.query.type, 'i');
    }
    
    if (req.query.host) {
      filter.host = new RegExp(req.query.host, 'i');
    }
    
    if (req.query.search) {
      filter.$or = [
        { full_name: new RegExp(req.query.search, 'i') },
        { visitor_name: new RegExp(req.query.search, 'i') },
        { email: new RegExp(req.query.search, 'i') },
        { host: new RegExp(req.query.search, 'i') },
        { cnic: new RegExp(req.query.search, 'i') },
        { visitor_cnic: new RegExp(req.query.search, 'i') },
        { phone: new RegExp(req.query.search, 'i') },
        { visitor_phone: new RegExp(req.query.search, 'i') },
        { purpose: new RegExp(req.query.search, 'i') }
      ];
    }
    
    if (req.query.startDate || req.query.endDate) {
      const dateFilter = {};
      
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        startDate.setHours(0, 0, 0, 0);
        dateFilter.$gte = startDate;
      }
      
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }
      
      filter.$or = [
        { entry_time: dateFilter },
        { timestamp: dateFilter }
      ];
      
      if (req.query.search) {
        const searchFilter = filter.$or;
        filter.$and = [
          {
            $or: [
              { entry_time: dateFilter },
              { timestamp: dateFilter }
            ]
          },
          {
            $or: searchFilter
          }
        ];
        delete filter.$or;
      }
    }

    // Get all matching records and sort in JavaScript
    const allVisitors = await Visitor.find(filter).lean();
    
    // Sort in JavaScript for consistent ordering
    allVisitors.sort((a, b) => {
      const getEffectiveDate = (visitor) => {
        const date = visitor.entry_time || visitor.timestamp;
        if (date instanceof Date) return date;
        if (typeof date === 'string') return new Date(date);
        return new Date(0);
      };
      
      const dateA = getEffectiveDate(a);
      const dateB = getEffectiveDate(b);
      
      const dateDiff = dateB.getTime() - dateA.getTime();
      if (dateDiff !== 0) return dateDiff;
      
      return b._id.toString().localeCompare(a._id.toString());
    });

    // Transform data
    const transformedVisitors = allVisitors.map(visitor => ({
      Type: visitor.type || '',
      Name: visitor.full_name || visitor.visitor_name || 'Unknown',
      CNIC: visitor.cnic || visitor.visitor_cnic || 'Not provided',
      Email: visitor.email || 'Not provided',
      Phone: visitor.phone || visitor.visitor_phone || 'Not provided',
      Host: visitor.host || '',
      Purpose: visitor.purpose || '',
      EntryTime: visitor.entry_time || visitor.timestamp
    }));

    res.json({
      visitors: transformedVisitors,
      total: transformedVisitors.length
    });
  } catch (error) {
    console.error('Error exporting visitors:', error);
    res.status(500).json({ 
      error: 'Failed to export visitors',
      message: error.message
    });
  }
});

// GET /api/visitors/unique-hosts - Get unique hosts for filter dropdown
router.get('/unique-hosts', async (req, res) => {
  try {
    const hosts = await Visitor.distinct('host');
    const filteredHosts = hosts.filter(host => host && host.trim() !== '');
    res.json(filteredHosts.sort());
  } catch (error) {
    console.error('Error fetching unique hosts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hosts',
      message: error.message
    });
  }
});

// GET /api/visitors/unique-types - Get unique visitor types
router.get('/unique-types', async (req, res) => {
  try {
    const types = await Visitor.distinct('type');
    const filteredTypes = types.filter(type => type && type.trim() !== '');
    res.json(filteredTypes.sort());
  } catch (error) {
    console.error('Error fetching unique types:', error);
    res.status(500).json({ 
      error: 'Failed to fetch types',
      message: error.message
    });
  }
});

module.exports = router;