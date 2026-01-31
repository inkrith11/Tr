import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-2xl font-bold text-primary mb-4">APSIT TradeHub</h3>
            <p className="text-gray-400 mb-4">
              The exclusive marketplace for APSIT students. Buy, sell, and trade books, 
              electronics, and accessories within your campus community.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <FaFacebook className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <FaTwitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <FaInstagram className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <FaLinkedin className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Browse Listings
                </Link>
              </li>
              <li>
                <Link to="/create-listing" className="text-gray-400 hover:text-white transition-colors">
                  Sell Item
                </Link>
              </li>
              <li>
                <Link to="/messages" className="text-gray-400 hover:text-white transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/?category=Books" className="text-gray-400 hover:text-white transition-colors">
                  Books
                </Link>
              </li>
              <li>
                <Link to="/?category=Electronics" className="text-gray-400 hover:text-white transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link to="/?category=Stationery" className="text-gray-400 hover:text-white transition-colors">
                  Stationery
                </Link>
              </li>
              <li>
                <Link to="/?category=Other" className="text-gray-400 hover:text-white transition-colors">
                  Other
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} APSIT TradeHub. All rights reserved.</p>
          <p className="mt-2 text-sm">Only for APSIT students with @apsit.edu.in email</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
