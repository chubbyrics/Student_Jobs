import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faFacebook } from "@fortawesome/free-brands-svg-icons";
import "../styles/About.css";
import james from "../assets/james.jpg";
import joanna from "../assets/joanna.jpg";
import kaili from "../assets/kaili.jpg";
import rics from "../assets/rics.jpg";
import Alyssa from "../assets/alyssa.png";


const About = () => {
  useEffect(() => {
    AOS.init({ duration: 1000 });
  }, []);

  const teamMembers = [
    {
      name: "Rica Mae Rapatan",
      role: "Lead Developer",
      img: rics,
      github: "https://github.com/chubbyrics",
      facebook: "https://www.facebook.com/share/18adoRj8gj/",
    },
    {
      name: "Mary Joanna May Gulle",
      role: "UI/UX Designer",
      img: joanna,
      github: "https://github.com/jnnsxz",
      facebook: "https://www.facebook.com/maryjoannamay.gulle.18",
    },
    {
      name: "James Carl Baliong",
      role: "Backend Developer",
      img: james,
      github: "https://github.com/mura-sn",
      facebook: "https://www.facebook.com/mashiro.onodera",
    },
    {
      name: "Rheniel Torremocha",
      role: "Frontend Developer",
      img: kaili,
      github: "https://github.com/rheniel02",
      facebook: "https://web.facebook.com/rhenibert.torremocha",
    },
    {
      name: "Alyssa Nicole Sacar",
      role: "Project Manager",
      img: Alyssa, 
      github: "https://github.com/Alyyuie",
      facebook: "https://www.facebook.com/alyyyuie",
    },
  ];
  
  return (
    <div className="about-container">
      <div className="team-section" data-aos="fade-up">
        <h3>Meet Our Team</h3>
        <p className="team-subtitle">The passionate developers behind StudentJobs</p>
    
        <div className="team-grid">
          {teamMembers.map((member, index) => (
            <div
              className="team-card"
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="team-card-inner">
                <div className="team-card-front">
                  <div className="team-image">
                    <img src={member.img} alt={member.name} />
                  </div>
                  <h4>{member.name}</h4>
                  <p>{member.role}</p>
                </div>
                <div className="team-card-back">
                  <p>Passionate about {member.role.toLowerCase()} and building scalable solutions.</p>
                  <div className="team-social">
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon icon={faGithub} />
                    </a>
                    <a
                      href={member.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FontAwesomeIcon icon={faFacebook} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
  export default About;