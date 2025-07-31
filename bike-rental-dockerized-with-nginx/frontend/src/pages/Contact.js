import React from 'react';
import { Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

function Contact() {
  return (
    <div
      style={{
        backgroundImage: 'url(/images/bike1.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '4rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          padding: '2rem',
          borderRadius: '1rem',
          maxWidth: '600px',
          marginBottom: '2rem',
          color: 'white',
        }}
      >
        <Typography variant="h4" gutterBottom>
          Contact Us
        </Typography>
        <Typography variant="body1">
          Our rental shop in Pattaya offers brand-new big bikes and Harley-Davidsons.
          You’re allowed to ride anywhere in Thailand, and all rentals come with full insurance coverage.
          Come visit us and ride with confidence and freedom!
        </Typography>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        style={{
          width: '100%',
          maxWidth: '600px',
          borderRadius: '1rem',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <iframe
          title="Pattaya Location"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3875.346891708833!2d100.8770802!3d12.9235566!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x310297e9b5f6e7e5%3A0xd8e49a3e2ffb16d1!2sPattaya%2C%20Bang%20Lamung%20District%2C%20Chon%20Buri%2C%20Thailand!5e0!3m2!1sen!2sth!4v1688388555555"
          width="100%"
          height="350"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
        />
      </motion.div>
    </div>
  );
}

export default Contact;
