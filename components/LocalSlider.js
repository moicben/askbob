import React, { useState } from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import Modal from 'react-modal';

const CustomNextArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    >
      →
    </div>
  );
};

const CustomPrevArrow = (props) => {
  const { className, style, onClick } = props;
  return (
    <div
      className={className}
      style={{ ...style, display: 'block' }}
      onClick={onClick}
    >
      ←
    </div>
  );
};

const LocalSlider = ({ locals }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('');

  const openModal = (url) => {
    setIframeSrc(url);
    setModalIsOpen(true);
    document.body.classList.add('no-scroll');
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setIframeSrc('');
    document.body.classList.remove('no-scroll');
  };

  const handleIframeError = () => {
    window.open('https://webteammanagement.com', '_blank');
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    nextArrow: <CustomNextArrow />,
    prevArrow: <CustomPrevArrow />,
    responsive: [
      {
        breakpoint: 768, // Adjust the breakpoint as needed
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
    ],
  };

  return (
    <>
      <Slider {...sliderSettings}>
        {locals.map((local, index) => (
          <div key={index} className="local-slide" onClick={() => openModal(local.local_website)}>
            <img src={local.local_img} alt={local.local_title} />
            <h4>{local.local_title}</h4>
            <p>{local.local_address || "Private location"}</p>
            <p>{local.local_phone}</p>
            <article>
              <span className='review-stars'>{local.local_rating <= 3.7 ? '⭐⭐' : local.local_rating <= 4.5 ? '⭐⭐⭐' : local.local_rating <= 4.8 ? '⭐⭐⭐⭐' : '⭐⭐⭐⭐⭐'}</span>
              <span className='review-classic'>{local.local_rating}/5</span>
              <p> {local.local_ratingCount} reviews</p>
            </article>
            <button>Discover company</button>
          </div>
        ))}
      </Slider>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className={'PopupModal'}
      >
        <button onClick={closeModal} className="close-button">
          <i className="fas fa-times"></i>
        </button>
        <iframe
          src={iframeSrc}
          width="100%"
          height="100%"
          onError={handleIframeError}
          title="Local Content"
        />
      </Modal>
    </>
  );
};

export default LocalSlider;