require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/config/db.js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.post('/api/auth/register', async (req, res) => {
  const { email, password, phone, role, profile, teacherProfile, companyProfile } = req.body;
  
  try {
    const userResult = await db.query(
      'INSERT INTO users (email, password, phone, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, password, phone, role]
    );
    
    const userId = userResult.rows[0].id;
    
    if (role === 'STUDENT') {
      await db.query(
        'INSERT INTO students (user_id, first_name, last_name, university, graduation_year, skills, email, profile_photo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [userId, profile?.firstName, profile?.lastName, profile?.university, profile?.graduationYear, profile?.skills, email, profile?.profilePhoto]
      );
    } else if (role === 'TEACHER') {
      await db.query(
        'INSERT INTO teachers (user_id, first_name, last_name, department, subject, experience, email, profile_photo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [userId, teacherProfile?.firstName, teacherProfile?.lastName, teacherProfile?.department, teacherProfile?.subject, teacherProfile?.experience, email, teacherProfile?.profilePhoto]
      );
    } else if (role === 'COMPANY') {
      await db.query(
        'INSERT INTO companies (id, user_id, company_name, email, sector, address, website, description, profile_photo) VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8)',
        [userId, companyProfile?.companyName, companyProfile?.email, companyProfile?.sector, companyProfile?.address, companyProfile?.website, companyProfile?.description, companyProfile?.profilePhoto]
      );
    }
    
    res.json({ success: true, id: userId, email, role, firstName: role === 'COMPANY' ? companyProfile?.companyName : profile?.firstName || teacherProfile?.firstName, lastName: role !== 'COMPANY' ? profile?.lastName || teacherProfile?.lastName : '' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await db.query(
      'SELECT id, email, phone, role FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      let firstName = '';
      let lastName = '';
      
      if (user.role === 'STUDENT') {
        const student = await db.query('SELECT first_name, last_name FROM students WHERE user_id = $1', [user.id]);
        if (student.rows.length > 0) {
          firstName = student.rows[0].first_name;
          lastName = student.rows[0].last_name;
        }
      } else if (user.role === 'TEACHER') {
        const teacher = await db.query('SELECT first_name, last_name FROM teachers WHERE user_id = $1', [user.id]);
        if (teacher.rows.length > 0) {
          firstName = teacher.rows[0].first_name;
          lastName = teacher.rows[0].last_name;
        }
      } else if (user.role === 'COMPANY') {
        const company = await db.query('SELECT company_name FROM companies WHERE user_id = $1', [user.id]);
        if (company.rows.length > 0) {
          firstName = company.rows[0].company_name;
        }
      }
      
      res.json({ success: true, id: user.id, email: user.email, role: user.role, firstName, lastName });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/internships/all', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, c.company_name, c.profile_photo as company_profile_photo, c.sector as company_sector, c.id as company_id
      FROM internships i
      JOIN companies c ON i.company_id = c.id
      WHERE (i.status != 'EXPIRED' OR i.status IS NULL)
    `);
    
    const internships = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      location: row.location,
      imageUrl: row.image_url,
      expirationDate: row.expiration_date,
      startDate: row.start_date,
      endDate: row.end_date,
      postedAt: row.posted_at,
      companyName: row.company_name,
      companyProfilePhoto: row.company_profile_photo,
      companySector: row.company_sector,
      companyId: row.company_id,
      status: row.status || 'ACTIVE'
    }));
    
    res.json(internships);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/internships/company/:userId', async (req, res) => {
  try {
    console.log('GET /api/internships/company/:userId - Looking up company for userId:', req.params.userId);
    
    let companyRecord = null;
    const companyByUser = await db.query('SELECT id FROM companies WHERE user_id = $1', [req.params.userId]);
    if (companyByUser.rows.length > 0) {
      companyRecord = companyByUser.rows[0];
    } else {
      const companyById = await db.query('SELECT id FROM companies WHERE id = $1', [req.params.userId]);
      if (companyById.rows.length > 0) {
        companyRecord = companyById.rows[0];
      }
    }
    
    if (!companyRecord) {
      console.log('Company not found for userId:', req.params.userId);
      return res.json([]);
    }
    const companyRecordId = companyRecord.id;
    console.log('Found company ID:', companyRecordId);
    
    const result = await db.query(
      'SELECT id, title, description, requirements, location, image_url, expiration_date, start_date, end_date, duration, status, posted_at FROM internships WHERE company_id = $1 ORDER BY posted_at DESC',
      [companyRecordId]
    );
    console.log('Number of internships retrieved:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Get company internships error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/internships/post', async (req, res) => {
  try {
    const { companyId, title, description, requirements, location, imageUrl, expirationDate, startDate, endDate, duration } = req.body;
    
    console.log('POST /api/internships/post - Received payload:', JSON.stringify(req.body, null, 2));
    
    if (!companyId || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields: companyId, title, description' });
    }
    
    let companyRecord = null;
    const companyByUser = await db.query('SELECT id, company_name, user_id FROM companies WHERE user_id = $1', [companyId]);
    if (companyByUser.rows.length > 0) {
      companyRecord = companyByUser.rows[0];
    } else {
      const companyById = await db.query('SELECT id, company_name, user_id FROM companies WHERE id = $1', [companyId]);
      if (companyById.rows.length > 0) {
        companyRecord = companyById.rows[0];
      }
    }
    
    console.log('Company lookup result - found:', companyRecord ? 'yes' : 'no');
    if (!companyRecord) {
      return res.status(400).json({ error: 'Company not found. Please ensure you are logged in as a company. User ID: ' + companyId });
    }
    
    const validImageUrl = (imageUrl && !imageUrl.startsWith('file://')) ? imageUrl : null;
    
    const result = await db.query(
      'INSERT INTO internships (company_id, title, description, requirements, location, image_url, expiration_date, start_date, end_date, duration, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, title, description, location, image_url, expiration_date, start_date, end_date, duration, status',
      [companyRecord.id, title, description, requirements || [], location, validImageUrl, expirationDate, startDate, endDate, duration || null, 'ACTIVE']
    );
    
    console.log('Internship created with ID:', result.rows[0].id);
    
    res.json({ success: true, internship: result.rows[0] });
  } catch (error) {
    console.error('Post internship error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/internships/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, requirements, location, expirationDate, startDate, endDate, status } = req.body;
  
  try {
    await db.query(
      'UPDATE internships SET title=$1, description=$2, requirements=$3, location=$4, expiration_date=$5, start_date=$6, end_date=$7, status=$8 WHERE id=$9',
      [title, description, requirements, location, expirationDate, startDate, endDate, status, id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/internships/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM internships WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/applications', async (req, res) => {
  const { internshipId, userId, message } = req.body;
  
  console.log('=== APPLY TO INTERNSHIP REQUEST ===');
  console.log('Authenticated user ID (from body):', userId);
  console.log('Internship ID:', internshipId);
  console.log('Message:', message);
  
  if (!internshipId || !userId) {
    console.log('Missing fields - rejecting');
    return res.status(400).json({ error: 'Missing internshipId or userId' });
  }
  
  try {
    console.log('Looking up user with ID:', userId);
    const userResult = await db.query('SELECT id, email, role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      console.log('User not found for ID:', userId);
      return res.status(400).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    console.log('Authenticated user:', { id: user.id, email: user.email, role: user.role });
    
    if (user.role === 'COMPANY') {
      console.log('Authorization result: BLOCKED - Company user cannot apply');
      return res.status(403).json({ error: 'Les entreprises ne peuvent pas postuler à des stages' });
    }
    
    console.log('Authorization result: ALLOWED - Role:', user.role);
    
    console.log('Checking for existing application for internshipId:', internshipId, 'userId:', userId);
    const existingApp = await db.query(
      'SELECT id FROM applications WHERE internship_id = $1 AND user_id = $2',
      [internshipId, userId]
    );
    if (existingApp.rows.length > 0) {
      console.log('Existing application found - rejecting');
      return res.status(400).json({ error: 'Vous avez déjà postulé à ce stage' });
    }
    
    console.log('Inserting new application into database');
    const result = await db.query(
      'INSERT INTO applications (internship_id, user_id, message) VALUES ($1, $2, $3) RETURNING *',
      [internshipId, userId, message || null]
    );
    
    console.log('Database insert result:', JSON.stringify(result.rows[0]));
    console.log('Final response: SUCCESS');
    res.json({ success: true, application: result.rows[0] });
  } catch (error) {
    console.error('Apply error:', error);
    console.log('Final response: ERROR');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications/internship/:internshipId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.email, u.phone, u.role, 
        s.first_name as student_first_name, s.last_name as student_last_name,
        s.profile_photo as student_profile_photo,
        s.university, s.graduation_year, s.skills,
        t.first_name as teacher_first_name, t.last_name as teacher_last_name,
        t.profile_photo as teacher_profile_photo,
        t.department, t.subject, t.experience
      FROM applications a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE a.internship_id = $1
      ORDER BY a.applied_at DESC
    `, [req.params.internshipId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get applicants error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications/company/:companyId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.email, u.phone, u.role,
        i.title as internship_title, i.location as internship_location, i.id as internship_id,
        i.company_id as company_id,
        s.first_name as student_first_name, s.last_name as student_last_name,
        s.profile_photo as student_profile_photo,
        s.university, s.graduation_year, s.skills, s.degree,
        t.first_name as teacher_first_name, t.last_name as teacher_last_name,
        t.profile_photo as teacher_profile_photo,
        t.department, t.subject, t.experience, t.filiere
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN internships i ON a.internship_id = i.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE i.company_id = $1
      ORDER BY a.applied_at DESC
    `, [req.params.companyId]);

    const enrichedRows = result.rows.map(row => ({
      ...row,
      internshipId: row.internship_id,
      companyId: row.company_id
    }));

    res.json(enrichedRows);
  } catch (error) {
    console.error('Get company applications error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/applications/:id', async (req, res) => {
  const { id } = req.params;
  const { status, companyId } = req.body;

  console.log('=== UPDATE APPLICATION STATUS REQUEST ===');
  console.log('Application ID:', id);
  console.log('Requested status:', status);
  console.log('Company ID:', companyId);

  try {
    console.log('Looking up application with ID:', id);
    const appResult = await db.query(
      'SELECT a.*, i.company_id FROM applications a JOIN internships i ON a.internship_id = i.id WHERE a.id = $1',
      [id]
    );

    if (appResult.rows.length === 0) {
      console.log('Application not found for ID:', id);
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = appResult.rows[0];
    console.log('Application found - company_id:', application.company_id);

    if (companyId && application.company_id !== parseInt(companyId)) {
      console.log('Authorization FAILED: company', companyId, 'does not own internship', application.company_id);
      return res.status(403).json({ error: 'You are not authorized to perform this action' });
    }

    console.log('Authorization PASSED - updating status to:', status);
    await db.query(
      'UPDATE applications SET status = $1 WHERE id = $2',
      [status, id]
    );

    const updatedApp = await db.query('SELECT * FROM applications WHERE id = $1', [id]);
    console.log('Database update result:', JSON.stringify(updatedApp.rows[0]));
    console.log('Response: SUCCESS - Application status updated');

    res.json({ success: true, message: 'Application status updated successfully', application: updatedApp.rows[0] });
  } catch (error) {
    console.error('Update application error:', error);
    console.log('Response: ERROR');
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications/count/:internshipId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN status = \'ACCEPTED\' THEN 1 ELSE 0 END) as accepted, SUM(CASE WHEN status = \'REJECTED\' THEN 1 ELSE 0 END) as rejected, SUM(CASE WHEN status = \'PENDING\' THEN 1 ELSE 0 END) as pending FROM applications WHERE internship_id = $1',
      [req.params.internshipId]
    );

    res.json({
      total: parseInt(result.rows[0].total) || 0,
      accepted: parseInt(result.rows[0].accepted) || 0,
      rejected: parseInt(result.rows[0].rejected) || 0,
      pending: parseInt(result.rows[0].pending) || 0
    });
  } catch (error) {
    console.error('Get count error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/applications/:id', async (req, res) => {
  const { id } = req.params;

  console.log('=== DELETE APPLICATION REQUEST ===');
  console.log('Application ID:', id);

  try {
    const result = await db.query('DELETE FROM applications WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      console.log('Application not found for deletion');
      return res.status(404).json({ error: 'Application not found' });
    }

    console.log('Application deleted successfully');
    res.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/applications/accepted/internship/:internshipId', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, u.email, u.phone, u.role,
        s.first_name as student_first_name, s.last_name as student_last_name,
        s.profile_photo as student_profile_photo,
        s.university, s.graduation_year, s.skills,
        t.first_name as teacher_first_name, t.last_name as teacher_last_name,
        t.profile_photo as teacher_profile_photo,
        t.department, t.subject, t.experience
      FROM applications a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE a.internship_id = $1 AND a.status = 'ACCEPTED'
      ORDER BY a.applied_at DESC
    `, [req.params.internshipId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get accepted candidates error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/evaluations', async (req, res) => {
  const { internshipId, applicantId, companyId, behaviorRating, skillsRating, comment } = req.body;

  console.log('=== CREATE EVALUATION REQUEST ===');
  console.log('Internship ID:', internshipId);
  console.log('Applicant ID:', applicantId);
  console.log('Company ID:', companyId);
  console.log('Behavior:', behaviorRating);
  console.log('Skills:', skillsRating);
  console.log('Comment:', comment);

  try {
    if (!internshipId || !applicantId || !companyId || !behaviorRating || !skillsRating) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(
      'INSERT INTO internship_evaluations (internship_id, applicant_id, company_id, behavior_rating, skills_rating, comment, evaluation_date) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) RETURNING *',
      [internshipId, applicantId, companyId, behaviorRating, skillsRating, comment || null]
    );

    console.log('Evaluation created:', result.rows[0]);
    res.json({ success: true, evaluation: result.rows[0] });
  } catch (error) {
    console.error('Create evaluation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/evaluations/applicant/:applicantId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, internship_id as internshipId, applicant_id as applicantId, company_id as companyId,
              behavior_rating as behaviorRating, skills_rating as skillsRating, comment, evaluation_date as evaluationDate
       FROM internship_evaluations
       WHERE applicant_id = $1
       ORDER BY evaluation_date DESC, created_at DESC`,
      [req.params.applicantId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get evaluations error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/evaluations/internship/:internshipId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, internship_id as internshipId, applicant_id as applicantId, company_id as companyId,
              behavior_rating as behaviorRating, skills_rating as skillsRating, comment, evaluation_date as evaluationDate
       FROM internship_evaluations
       WHERE internship_id = $1
       ORDER BY evaluation_date DESC, created_at DESC`,
      [req.params.internshipId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get evaluations by internship error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/evaluations/user/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT e.id, e.internship_id as internshipId, e.applicant_id as applicantId, e.company_id as companyId,
              e.behavior_rating as behaviorRating, e.skills_rating as skillsRating, e.comment, e.evaluation_date as evaluationDate
       FROM internship_evaluations e
       JOIN applications a ON e.applicant_id = a.id
       WHERE a.user_id = $1
       ORDER BY e.evaluation_date DESC, e.created_at DESC`,
      [req.params.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get evaluations by user error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/evaluations/application/:applicationId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, internship_id as internshipId, applicant_id as applicantId, company_id as companyId,
              behavior_rating as behaviorRating, skills_rating as skillsRating, comment, evaluation_date as evaluationDate
       FROM internship_evaluations
       WHERE applicant_id = $1
       ORDER BY evaluation_date DESC, created_at DESC`,
      [req.params.applicationId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get evaluations by application error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { userId, amount } = req.body;
    
    // Get user email from database
    const userResult = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
    const userEmail = userResult.rows.length > 0 ? userResult.rows[0].email : `user_${userId}@carreertrack.app`;
    
    let customerId = null;
    const existingCustomers = await stripe.customers.list({ limit: 100 });
    const foundCustomer = existingCustomers.data.find(c => c.email === userEmail || c.metadata?.userId === userId.toString());
    if (foundCustomer) {
      customerId = foundCustomer.id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
        description: 'CareerTrack User',
        metadata: { userId: userId.toString() }
      });
      customerId = customer.id;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 500,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      customerId: customerId,
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/payments/mark-featured', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    // Get user role to determine which table to update
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const userRole = userResult.rows[0].role;
    let tableName = '';
    let successMessage = '';

    if (userRole === 'STUDENT') {
      tableName = 'students';
      successMessage = 'Profil étudiant premium activé pour 30 jours';
    } else if (userRole === 'TEACHER') {
      tableName = 'teachers';
      successMessage = 'Profil professeur premium activé pour 30 jours';
    } else if (userRole === 'COMPANY') {
      tableName = 'companies';
      successMessage = 'Profil entreprise premium activé pour 30 jours';
    } else {
      return res.status(400).json({ error: 'Rôle utilisateur invalide' });
    }

    const result = await db.query(
      `UPDATE ${tableName} SET is_featured = true, featured_until = CURRENT_DATE + INTERVAL '30 days' WHERE user_id = $1 RETURNING *`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    res.json({ success: true, message: successMessage });
  } catch (error) {
    console.error('Mark featured error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/companies/:id', async (req, res) => {
  try {
    const companyId = req.params.id;
    const result = await db.query(
      'SELECT id, user_id, company_name, sector, address, website, description, profile_photo FROM companies WHERE id = $1',
      [companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const company = result.rows[0];
    res.json({
      id: company.id,
      userId: company.user_id,
      companyName: company.company_name,
      sector: company.sector,
      address: company.address,
      website: company.website,
      description: company.description,
      profilePhoto: company.profile_photo,
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/people/search', async (req, res) => {
  try {
    const { keyword = '', type = '', degree = '', filiere = '', featured = false } = req.query;
    
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (featured === 'true') {
      conditions.push(`(s.is_featured = true OR t.is_featured = true OR c.is_featured = true)`);
    }

    let query = `
      SELECT 
        u.id,
        u.email,
        u.phone,
        u.role,
        s.is_featured as student_is_featured,
        t.is_featured as teacher_is_featured,
        c.is_featured as company_is_featured,
        s.first_name as "firstName",
        s.last_name as "lastName",
        s.university,
        s.graduation_year as "graduationYear",
        s.skills,
        s.degree,
        s.profile_photo as "profilePhoto",
        t.first_name as "teacherFirstName",
        t.last_name as "teacherLastName",
        t.department,
        t.subject,
        t.experience,
        t.filiere,
        t.profile_photo as "teacherProfilePhoto",
        c.company_name as "companyName",
        c.sector,
        c.profile_photo as "companyProfilePhoto"
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      LEFT JOIN companies c ON u.id = c.user_id
      WHERE u.role IN ('STUDENT', 'TEACHER', 'COMPANY')
    `;

    if (type && type !== 'Tous') {
      conditions.push(`u.role = $${paramIndex++}`);
      params.push(type);
    }

    if (degree) {
      conditions.push(`(s.degree = $${paramIndex++} OR t.filiere = $${paramIndex - 1})`);
      params.push(degree);
    }

    if (filiere) {
      conditions.push(`(t.filiere = $${paramIndex++} OR s.skills ILIKE $${paramIndex++})`);
      params.push(filiere, `%${filiere}%`);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY u.id DESC LIMIT 100';

    const result = await db.query(query, params);

    const profiles = result.rows.map(row => {
      const profile = {
        id: row.id,
        email: row.email,
        phone: row.phone,
        type: row.role,
        profilePhoto: row.profilePhoto || row.teacherProfilePhoto || row.companyProfilePhoto,
      };

      if (row.role === 'STUDENT') {
        profile.firstName = row.firstName;
        profile.lastName = row.lastName;
        profile.university = row.university;
        profile.graduationYear = row.graduationYear;
        profile.skills = row.skills;
        profile.degree = row.degree;
        profile.isFeatured = row.student_is_featured || row.is_featured;
      } else if (row.role === 'TEACHER') {
        profile.firstName = row.teacherFirstName;
        profile.lastName = row.teacherLastName;
        profile.department = row.department;
        profile.subject = row.subject;
        profile.experience = row.experience;
        profile.filiere = row.filiere;
        profile.isFeatured = row.teacher_is_featured || row.is_featured;
      } else if (row.role === 'COMPANY') {
        profile.companyName = row.companyName;
        profile.sector = row.sector;
        profile.isFeatured = row.company_is_featured || row.is_featured;
      }

      return profile;
    });

    if (featured === 'true') {
      return res.json(profiles.filter(p => p.isFeatured));
    }

    res.json(profiles);
  } catch (error) {
    console.error('Search people error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/companies/evaluations/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await db.query(
      `SELECT c.id as companyId, c.company_name as companyName, c.sector, c.profile_photo,
               a.id as applicationId, i.id as internshipId, i.title as internshipTitle, a.status as applicationStatus,
               e.behavior_rating as behaviorRating, e.skills_rating as skillsRating, e.comment, e.evaluation_date as evaluationDate,
               a.applied_at
        FROM applications a
        JOIN internships i ON a.internship_id = i.id
        JOIN companies c ON i.company_id = c.id
        LEFT JOIN internship_evaluations e ON e.internship_id = i.id AND e.applicant_id = a.id AND e.company_id = c.id
        WHERE a.user_id = $1 AND a.status = 'ACCEPTED'
        ORDER BY a.applied_at DESC, e.evaluation_date DESC`,
      [userId]
    );

    const companiesMap = {};
    result.rows.forEach(row => {
      if (!companiesMap[row.companyId]) {
        companiesMap[row.companyId] = {
          companyId: row.companyId,
          companyName: row.companyName,
          sector: row.sector,
          profilePhoto: row.profile_photo,
          applications: []
        };
      }
      if (row.applicationId && !companiesMap[row.companyId].applications.find(app => app.applicationId === row.applicationId)) {
        companiesMap[row.companyId].applications.push({
          applicationId: row.applicationId,
          internshipId: row.internshipId,
          internshipTitle: row.internshipTitle,
          status: row.applicationStatus,
          behaviorRating: row.behaviorRating,
          skillsRating: row.skillsRating,
          comment: row.comment,
          evaluationDate: row.evaluationDate
        });
      }
    });

    res.json({ success: true, companies: Object.values(companiesMap) });
  } catch (error) {
    console.error('Get companies with evaluations error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});