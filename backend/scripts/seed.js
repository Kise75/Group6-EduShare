const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Message = require('../models/Message');
const Meetup = require('../models/Meetup');
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const Review = require('../models/Review');
const { CAMPUS_LOCATIONS } = require('../utils/campusLocations');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const connect = async () => {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

const asset = (fileName) => `/product-images/${fileName}`;

const run = async () => {
  try {
    await connect();

    await Promise.all([
      Notification.deleteMany({}),
      Report.deleteMany({}),
      Review.deleteMany({}),
      Meetup.deleteMany({}),
      Message.deleteMany({}),
      Listing.deleteMany({}),
      User.deleteMany({}),
    ]);

    const password = await bcrypt.hash('123456', 10);

    const [adminUser, sellerA, buyerA, sellerB] = await User.create([
      {
        name: 'EduShare Support',
        email: 'admin@edushare.dev',
        username: 'admin',
        password,
        major: 'System Administration',
        role: 'admin',
        emailVerified: true,
        trackedCourseCodes: ['CS101', 'STAT201'],
        preferredMeetupLocations: ['Student Center', 'Campus Library'],
      },
      {
        name: 'Minh Tran',
        email: 'john@edushare.dev',
        password,
        major: 'Computer Science',
        emailVerified: true,
        trackedCourseCodes: ['MATH101', 'CHEM301'],
        preferredMeetupLocations: ['Campus Library', 'Cafeteria'],
      },
      {
        name: 'Phuong Nguyen',
        email: 'jane@edushare.dev',
        password,
        major: 'Mechanical Engineering',
        emailVerified: true,
        trackedCourseCodes: ['MATH101', 'ENGR120'],
        preferredMeetupLocations: ['Student Center', 'Campus Gate A'],
      },
      {
        name: 'Linh Vo',
        email: 'alice@edushare.dev',
        password,
        major: 'Business Administration',
        emailVerified: true,
        trackedCourseCodes: ['ART210', 'CHEM205'],
        preferredMeetupLocations: ['Student Center', 'Sports Ground'],
      },
    ]);

    const listings = await Listing.create([
      {
        title: 'Calculus Textbook',
        description:
          'Early transcendentals textbook in good condition. Some highlights in chapter 2 and 3.',
        courseCode: 'MATH101',
        category: 'Textbooks',
        condition: 'Good',
        price: 185000,
        priceHistory: [{ amount: 185000 }],
        seller: sellerA._id,
        edition: '8th Edition',
        isbn: '978-0-321-78900-0',
        images: [asset('calculus-textbook.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[0].id,
          name: CAMPUS_LOCATIONS[0].name,
          zone: CAMPUS_LOCATIONS[0].zone,
          safetyScore: CAMPUS_LOCATIONS[0].safetyScore,
          coordinates: CAMPUS_LOCATIONS[0].coordinates,
        },
      },
      {
        title: 'Chemistry Lab Kit',
        description: 'Contains goggles, pipette, and full set of lab accessories.',
        courseCode: 'CHEM205',
        category: 'Lab Kits',
        condition: 'Fair',
        price: 145000,
        priceHistory: [{ amount: 145000 }],
        seller: sellerB._id,
        images: [asset('chemistry-lab-kit.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[1].id,
          name: CAMPUS_LOCATIONS[1].name,
          zone: CAMPUS_LOCATIONS[1].zone,
          safetyScore: CAMPUS_LOCATIONS[1].safetyScore,
          coordinates: CAMPUS_LOCATIONS[1].coordinates,
        },
      },
      {
        title: 'Physics Notes',
        description: 'Neat handwritten notes for Physics 101 with solved examples.',
        courseCode: 'PHYS100',
        category: 'Notes',
        condition: 'Good',
        price: 45000,
        priceHistory: [{ amount: 45000 }],
        seller: sellerA._id,
        images: [asset('physics-notes.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[3].id,
          name: CAMPUS_LOCATIONS[3].name,
          zone: CAMPUS_LOCATIONS[3].zone,
          safetyScore: CAMPUS_LOCATIONS[3].safetyScore,
          coordinates: CAMPUS_LOCATIONS[3].coordinates,
        },
      },
      {
        title: 'Introduction to Calculus',
        description: 'Used copy, still in readable condition and perfect for first year review.',
        courseCode: 'MATH100',
        category: 'Textbooks',
        condition: 'Fair',
        price: 120000,
        priceHistory: [{ amount: 120000 }],
        seller: sellerB._id,
        images: [asset('introduction-calculus.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[0].id,
          name: CAMPUS_LOCATIONS[0].name,
          zone: CAMPUS_LOCATIONS[0].zone,
          safetyScore: CAMPUS_LOCATIONS[0].safetyScore,
          coordinates: CAMPUS_LOCATIONS[0].coordinates,
        },
      },
      {
        title: 'Laptop Charger 65W',
        description: 'Universal adapter for student use.',
        courseCode: '',
        category: 'Others',
        condition: 'Good',
        price: 180000,
        priceHistory: [{ amount: 180000 }],
        seller: sellerA._id,
        images: [asset('laptop-charger.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[2].id,
          name: CAMPUS_LOCATIONS[2].name,
          zone: CAMPUS_LOCATIONS[2].zone,
          safetyScore: CAMPUS_LOCATIONS[2].safetyScore,
          coordinates: CAMPUS_LOCATIONS[2].coordinates,
        },
      },
      {
        title: 'Biology Flashcards Set',
        description: 'A full flashcard pack for BIO110 with diagrams and memory cues.',
        courseCode: 'BIO110',
        category: 'Notes',
        condition: 'New',
        price: 55000,
        priceHistory: [{ amount: 55000 }],
        seller: buyerA._id,
        images: [asset('biology-flashcards.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[4].id,
          name: CAMPUS_LOCATIONS[4].name,
          zone: CAMPUS_LOCATIONS[4].zone,
          safetyScore: CAMPUS_LOCATIONS[4].safetyScore,
          coordinates: CAMPUS_LOCATIONS[4].coordinates,
        },
      },
      {
        title: 'Engineering Drawing Set',
        description: 'Includes ruler, mechanical pencils, compass, and sketch templates.',
        courseCode: 'ENGR120',
        category: 'Others',
        condition: 'Good',
        price: 95000,
        priceHistory: [{ amount: 95000 }],
        seller: adminUser._id,
        images: [asset('engineering-drawing-set.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[1].id,
          name: CAMPUS_LOCATIONS[1].name,
          zone: CAMPUS_LOCATIONS[1].zone,
          safetyScore: CAMPUS_LOCATIONS[1].safetyScore,
          coordinates: CAMPUS_LOCATIONS[1].coordinates,
        },
      },
      {
        title: 'Statistics Workbook',
        description: 'Workbook with practice exercises, solved examples, and revision notes.',
        courseCode: 'STAT201',
        category: 'Textbooks',
        condition: 'Good',
        price: 90000,
        priceHistory: [{ amount: 90000 }],
        seller: buyerA._id,
        images: [asset('statistics-workbook.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[3].id,
          name: CAMPUS_LOCATIONS[3].name,
          zone: CAMPUS_LOCATIONS[3].zone,
          safetyScore: CAMPUS_LOCATIONS[3].safetyScore,
          coordinates: CAMPUS_LOCATIONS[3].coordinates,
        },
      },
      {
        title: 'Organic Chemistry Notes',
        description: 'Color-coded notes with reaction maps and quick summary pages.',
        courseCode: 'CHEM301',
        category: 'Notes',
        condition: 'Good',
        price: 60000,
        priceHistory: [{ amount: 60000 }],
        seller: sellerA._id,
        images: [asset('organic-chemistry-notes.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[0].id,
          name: CAMPUS_LOCATIONS[0].name,
          zone: CAMPUS_LOCATIONS[0].zone,
          safetyScore: CAMPUS_LOCATIONS[0].safetyScore,
          coordinates: CAMPUS_LOCATIONS[0].coordinates,
        },
      },
      {
        title: 'Linear Algebra Textbook',
        description: 'Clean textbook with a few sticky notes and no pen marks.',
        courseCode: 'MATH205',
        category: 'Textbooks',
        condition: 'Good',
        price: 160000,
        priceHistory: [{ amount: 160000 }],
        seller: sellerB._id,
        images: [asset('linear-algebra-textbook.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[0].id,
          name: CAMPUS_LOCATIONS[0].name,
          zone: CAMPUS_LOCATIONS[0].zone,
          safetyScore: CAMPUS_LOCATIONS[0].safetyScore,
          coordinates: CAMPUS_LOCATIONS[0].coordinates,
        },
      },
      {
        title: 'Art History Study Pack',
        description: 'Printed slides, annotated timeline, and museum summary sheets.',
        courseCode: 'ART210',
        category: 'Notes',
        condition: 'New',
        price: 50000,
        priceHistory: [{ amount: 50000 }],
        seller: buyerA._id,
        images: [asset('art-history-study-pack.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[1].id,
          name: CAMPUS_LOCATIONS[1].name,
          zone: CAMPUS_LOCATIONS[1].zone,
          safetyScore: CAMPUS_LOCATIONS[1].safetyScore,
          coordinates: CAMPUS_LOCATIONS[1].coordinates,
        },
      },
      {
        title: 'Programming Fundamentals Book',
        description: 'Starter programming book for beginners with practical exercises.',
        courseCode: 'CS101',
        category: 'Textbooks',
        condition: 'Good',
        price: 140000,
        priceHistory: [{ amount: 140000 }],
        seller: sellerA._id,
        images: [asset('programming-fundamentals-book.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[0].id,
          name: CAMPUS_LOCATIONS[0].name,
          zone: CAMPUS_LOCATIONS[0].zone,
          safetyScore: CAMPUS_LOCATIONS[0].safetyScore,
          coordinates: CAMPUS_LOCATIONS[0].coordinates,
        },
      },
      {
        title: 'Digital Logic Lab Notes',
        description: 'Lab writeups, truth tables, and quick reference sheets for weekly sessions.',
        courseCode: 'CPE220',
        category: 'Notes',
        condition: 'Good',
        price: 65000,
        priceHistory: [{ amount: 65000 }],
        seller: sellerB._id,
        images: [asset('digital-logic-lab-notes.svg')],
        campusLocation: {
          id: CAMPUS_LOCATIONS[2].id,
          name: CAMPUS_LOCATIONS[2].name,
          zone: CAMPUS_LOCATIONS[2].zone,
          safetyScore: CAMPUS_LOCATIONS[2].safetyScore,
          coordinates: CAMPUS_LOCATIONS[2].coordinates,
        },
      },
    ]);

    const [meetupCompleted, meetupPending] = await Meetup.create([
      {
        listing: listings[0]._id,
        buyer: buyerA._id,
        seller: sellerA._id,
        location: 'Campus Library',
        locationId: 'library',
        date: new Date('2026-03-10T00:00:00Z'),
        time: '14:30',
        status: 'Completed',
        buyerConfirmed: true,
        sellerConfirmed: true,
        confirmedAt: new Date('2026-03-09T10:00:00Z'),
        completedAt: new Date('2026-03-10T15:00:00Z'),
      },
      {
        listing: listings[1]._id,
        buyer: buyerA._id,
        seller: sellerB._id,
        location: 'Student Center',
        locationId: 'student-center',
        date: new Date('2026-03-20T00:00:00Z'),
        time: '09:00',
        status: 'Pending',
        buyerConfirmed: true,
        sellerConfirmed: false,
        suggestedLocations: CAMPUS_LOCATIONS.slice(0, 3).map((location, index) => ({
          id: location.id,
          name: location.name,
          score: Number((location.safetyScore * 2 - index * 0.1).toFixed(2)),
          reason: index === 0 ? 'Preferred by both buyer and seller' : 'Safe campus meetup point',
        })),
      },
    ]);

    listings[0].status = 'Sold';
    listings[1].status = 'Reserved';
    listings[1].reservedBy = buyerA._id;
    listings[1].reservedAt = new Date('2026-03-18T08:00:00Z');
    await Promise.all([listings[0].save(), listings[1].save()]);

    await Message.create({
      listing: listings[1]._id,
      participant1: buyerA._id,
      participant2: sellerB._id,
      messages: [
        {
          senderId: buyerA._id,
          text: 'Hi, is the chemistry kit still available?',
          timestamp: new Date('2026-03-11T02:00:00Z'),
          isRead: true,
        },
        {
          senderId: sellerB._id,
          text: 'Yes, it is. We can meet on campus tomorrow.',
          timestamp: new Date('2026-03-11T02:10:00Z'),
          isRead: false,
        },
      ],
      lastMessage: new Date('2026-03-11T02:10:00Z'),
    });

    await Review.create({
      listing: listings[0]._id,
      reviewer: buyerA._id,
      reviewee: sellerA._id,
      rating: 5,
      comment: 'Friendly seller and smooth meetup.',
      meetup: meetupCompleted._id,
    });

    sellerA.rating = 5;
    sellerA.totalRatings = 1;
    await sellerA.save();

    console.log('Seed completed');
    console.log('Sample login: admin / 123456');
    console.log('Sample login: jane@edushare.dev / 123456');
    console.log('Sample login: john@edushare.dev / 123456');
    console.log('Sample login: alice@edushare.dev / 123456');
    console.log(`Sample completed meetup id: ${meetupCompleted._id}`);
    console.log(`Sample pending meetup id: ${meetupPending._id}`);
  } catch (error) {
    console.error('Seed failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

run();
