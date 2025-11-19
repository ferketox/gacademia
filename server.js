const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();



// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI /*|| 'mongodb://localhost:27017/groupmanager'*/, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log('MongoDB Error:', err));

// Group Schema
const groupSchema = new mongoose.Schema({
    /*_id: Number,*/
    name: String,
    members: [String],
    requirements: String,
    volunteers: [{
        name: String,
        id: Number
    }],
    isComplete: Boolean
});

const Group = mongoose.model('Group', groupSchema);

// API Routes

// Get all groups
app.get('/api/groups', async (req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add volunteer to a group
app.post('/api/groups/:id/volunteer', async (req, res) => {
    try {
        const { name } = req.body;
        /*const group = await Group.findOne({ _id: parseInt(req.params.id) });*/
        const groupId = req.params.id;
        const group = await Group.findById(groupId);
         
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        group.volunteers.push({
            name: name,
            id: Date.now()
        });
        
        await group.save();
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Confirm volunteer (move to members)
app.post('/api/groups/:groupId/confirm/:volunteerId', async (req, res) => {
    try {
        /*const group = await Group.findOne({ _id: parseInt(req.params.groupId) });*/
        const group = await Group.findById(req.params.groupId);

        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        const volunteer = group.volunteers.find(v => v.id === parseInt(req.params.volunteerId));
        
        if (volunteer) {
            group.members.push(volunteer.name);
            group.volunteers = group.volunteers.filter(v => v.id !== parseInt(req.params.volunteerId));
            await group.save();
        }
        
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove volunteer
app.delete('/api/groups/:groupId/volunteer/:volunteerId', async (req, res) => {
    try {
        /*const group = await Group.findOne({ _id: parseInt(req.params.groupId) });*/
        const group = await Group.findById(req.params.groupId);

        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }
        
        group.volunteers = group.volunteers.filter(v => v.id !== parseInt(req.params.volunteerId));
        await group.save();
        
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Initialize database with sample data (run once)
app.post('/api/init', async (req, res) => {
    try {
        const count = await Group.countDocuments();
        if (count === 0) {
            const sampleGroups = [
                {
                    name: "Design Team",
                    members: ["Sarah Johnson", "Mike Chen"],
                    requirements: "2 boys, 3 girls needed",
                    volunteers: [],
                    isComplete: false
                },
                {
                    name: "Marketing Squad",
                    members: ["Emma Davis", "Lucas Brown", "Sophia Martinez", "James Wilson"],
                    requirements: "1 more member needed",
                    volunteers: [],
                    isComplete: false
                },
                {
                    name: "Development Crew",
                    members: ["Alex Turner", "Maya Patel", "Chris Anderson", "Olivia Lee", "Ryan Cooper"],
                    requirements: "Complete",
                    volunteers: [],
                    isComplete: true
                },
                {
                    name: "Research Group",
                    members: ["Daniel Kim"],
                    requirements: "3 more members needed",
                    volunteers: [],
                    isComplete: false
                }
            ];
            
            await Group.insertMany(sampleGroups);
            res.json({ message: 'Database initialized with sample data' });
        } else {
            res.json({ message: 'Database already has data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
