const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')


// Get All Notes - GET /notes - Private
const getAllNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find().lean() //lean, eleminates methods like save()

    if(!notes?.length) {
        return res.status(400).json({ message: 'No notes found' })
    }

    // Add username to each note before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const notesWithUser = await Promise.all(notes.map(async (note) => {
        
        const user = await User.findById(note.user).lean().exec()
        return { ...note, username: user.username }
    }))


    res.json(notesWithUser)
})


// Create New Note - POST /notes - Private
const createNewNote = asyncHandler(async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text){
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({locale:'en', strength:2}).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }


    // Create and store new note
    const note = await Note.create({ user, title, text })

    if (note) { // created
        return res.status(201).json({ message: 'New note created' })
    } else {
        return res.status(400).json({ message: 'Invalid note data received' })
    }

})


// Update a Note - PATCH /notes - Private
const updateNote = asyncHandler(async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    // Check for duplicate title
    const duplicate = await Note.findOne({ title }).collation({locale:'en', strength:2}).lean().exec()

    // Allow renaming of the original note 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate note title' })
    }

    note.user = user
    note.title = title
    note.text = text
    note.completed = completed

    const updatedNote = await note.save()

    res.json({ message: `${updatedNote.title} updated`})
})


// Delete a Note - Delete /notes - Private
const deleteNote = asyncHandler(async (req, res) => {
    const { id } = req.body

    if(!id) {
        return res.status(400).json({ message: 'Note ID Required' })
    }

    const note = await Note.findById(id).exec()

    if(!note) {
        return res.status(400).json({ message: 'Note not found' })
    }

    const result = await note.deleteOne()

    const reply = `${result.title} with ID ${result.id} deleted`

    res.json(reply)

})


module.exports = { getAllNotes, createNewNote, updateNote, deleteNote }